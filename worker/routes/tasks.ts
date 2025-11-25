import { Hono } from 'hono';
import { getFirebaseToken } from '@hono/firebase-auth';
import type { VerifyFirebaseAuthEnv } from '@hono/firebase-auth';
import type { D1Database } from '@cloudflare/workers-types';
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskWithTags,
  ApiResponse,
  TaskFilters,
  Tag,
  TaskStatus,
  TaskPriority,
} from '../db-types';
import { getUserByFirebaseUid, checkTaskAccess, logTaskHistory, buildTaskFilters } from '../utils/db-helpers';

type Bindings = Env & VerifyFirebaseAuthEnv;
const taskRoutes = new Hono<{ Bindings: Bindings }>();

// Helper: Get tasks with tags
async function getTaskWithTags(db: D1Database, taskId: number): Promise<TaskWithTags | null> {
  const task = await db
    .prepare('SELECT * FROM tasks WHERE id = ? AND is_deleted = 0')
    .bind(taskId)
    .first<Task>();

  if (!task) return null;

  const { results: tags } = await db
    .prepare(`
      SELECT t.* FROM tags t
      INNER JOIN task_tags tt ON t.id = tt.tag_id
      WHERE tt.task_id = ?
    `)
    .bind(taskId)
    .all<Tag>();

  return { ...task, tags };
}

// Create task
taskRoutes.post('/', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const body = await c.req.json<TaskCreateInput>();

    // Validate required fields
    if (!body.title || !body.start_datetime) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Title and start_datetime are required' },
        400
      );
    }

    // Insert task
    const task = await c.env.DB.prepare(`
      INSERT INTO tasks (
        user_id, title, description, start_datetime, deadline_datetime, priority, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `)
      .bind(
        user.id,
        body.title,
        body.description || null,
        body.start_datetime,
        body.deadline_datetime || null,
        body.priority || 'medium',
        body.status || 'planned'
      )
      .first<Task>();

    // Add tags if provided
    if (body.tag_ids && body.tag_ids.length > 0) {
      for (const tagId of body.tag_ids) {
        await c.env.DB.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)')
          .bind(task!.id, tagId)
          .run();
      }
    }

    // Log history
    await logTaskHistory(c.env.DB, task!.id, user.id, 'created');

    // Get task with tags
    const taskWithTags = await getTaskWithTags(c.env.DB, task!.id);

    return c.json<ApiResponse<TaskWithTags>>({ success: true, data: taskWithTags! }, 201);
  } catch (error) {
    console.error('Error creating task:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to create task' },
      500
    );
  }
});

// Get tasks with filters
taskRoutes.get('/', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    // Parse filters from query params
    const filters: TaskFilters = {
      date_from: c.req.query('date_from'),
      date_to: c.req.query('date_to'),
      search: c.req.query('search'),
      include_shared: c.req.query('include_shared') === 'true',
      include_archived: c.req.query('include_archived') === 'true',
    };

    const statusParam = c.req.query('status');
    if (statusParam) {
      filters.status = statusParam.split(',') as TaskStatus[];
    }

    const priorityParam = c.req.query('priority');
    if (priorityParam) {
      filters.priority = priorityParam.split(',') as TaskPriority[];
    }

    const tagIdsParam = c.req.query('tag_ids');
    if (tagIdsParam) {
      filters.tag_ids = tagIdsParam.split(',').map((id) => parseInt(id, 10));
    }

    const { where, bindings } = buildTaskFilters(user.id, filters);

    let query = `SELECT DISTINCT tasks.* FROM tasks`;

    // Join with task_tags if filtering by tags
    if (filters.tag_ids && filters.tag_ids.length > 0) {
      query += ` INNER JOIN task_tags ON tasks.id = task_tags.task_id`;
      query += ` WHERE ${where} AND task_tags.tag_id IN (${filters.tag_ids.map(() => '?').join(',')})`;
      bindings.push(...filters.tag_ids);
    } else {
      query += ` WHERE ${where}`;
    }

    query += ` ORDER BY tasks.start_datetime ASC`;

    const { results: tasks } = await c.env.DB.prepare(query)
      .bind(...bindings)
      .all<Task>();

    // Get tags for each task
    const tasksWithTags: TaskWithTags[] = await Promise.all(
      tasks.map(async (task) => {
        const { results: tags } = await c.env.DB.prepare(`
          SELECT t.* FROM tags t
          INNER JOIN task_tags tt ON t.id = tt.tag_id
          WHERE tt.task_id = ?
        `)
          .bind(task.id)
          .all<Tag>();

        return { ...task, tags };
      })
    );

    return c.json<ApiResponse<TaskWithTags[]>>({ success: true, data: tasksWithTags });
  } catch (error) {
    console.error('Error getting tasks:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to get tasks' },
      500
    );
  }
});

// Get single task
taskRoutes.get('/:id', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const taskId = parseInt(c.req.param('id'), 10);

    // Check access
    const access = await checkTaskAccess(c.env.DB, taskId, user.id);
    if (!access.hasAccess) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Access denied' },
        403
      );
    }

    const taskWithTags = await getTaskWithTags(c.env.DB, taskId);

    if (!taskWithTags) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Task not found' }, 404);
    }

    return c.json<ApiResponse<TaskWithTags>>({ success: true, data: taskWithTags });
  } catch (error) {
    console.error('Error getting task:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to get task' },
      500
    );
  }
});

// Update task
taskRoutes.put('/:id', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const taskId = parseInt(c.req.param('id'), 10);

    // Check access (must be owner or have edit permission)
    const access = await checkTaskAccess(c.env.DB, taskId, user.id);
    if (!access.hasAccess || (access.permission !== 'owner' && access.permission !== 'edit')) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Access denied' },
        403
      );
    }

    const body = await c.req.json<TaskUpdateInput>();

    const updates: string[] = [];
    const bindings: unknown[] = [];
    const changes: Record<string, unknown> = {};

    if (body.title !== undefined) {
      updates.push('title = ?');
      bindings.push(body.title);
      changes.title = body.title;
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      bindings.push(body.description);
      changes.description = body.description;
    }
    if (body.start_datetime !== undefined) {
      updates.push('start_datetime = ?');
      bindings.push(body.start_datetime);
      changes.start_datetime = body.start_datetime;
    }
    if (body.deadline_datetime !== undefined) {
      updates.push('deadline_datetime = ?');
      bindings.push(body.deadline_datetime);
      changes.deadline_datetime = body.deadline_datetime;
    }
    if (body.priority !== undefined) {
      updates.push('priority = ?');
      bindings.push(body.priority);
      changes.priority = body.priority;
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      bindings.push(body.status);
      changes.status = body.status;
    }

    if (updates.length > 0) {
      bindings.push(taskId);
      await c.env.DB.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`)
        .bind(...bindings)
        .run();

      // Log history
      await logTaskHistory(c.env.DB, taskId, user.id, 'updated', changes);
    }

    // Update tags if provided
    if (body.tag_ids !== undefined) {
      // Remove existing tags
      await c.env.DB.prepare('DELETE FROM task_tags WHERE task_id = ?')
        .bind(taskId)
        .run();

      // Add new tags
      for (const tagId of body.tag_ids) {
        await c.env.DB.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)')
          .bind(taskId, tagId)
          .run();
      }
    }

    const taskWithTags = await getTaskWithTags(c.env.DB, taskId);

    return c.json<ApiResponse<TaskWithTags>>({ success: true, data: taskWithTags! });
  } catch (error) {
    console.error('Error updating task:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to update task' },
      500
    );
  }
});

// Update task status only
taskRoutes.patch('/:id/status', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const taskId = parseInt(c.req.param('id'), 10);

    // Check access
    const access = await checkTaskAccess(c.env.DB, taskId, user.id);
    if (!access.hasAccess || (access.permission !== 'owner' && access.permission !== 'edit')) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Access denied' },
        403
      );
    }

    const { status } = await c.req.json<{ status: string }>();

    await c.env.DB.prepare('UPDATE tasks SET status = ? WHERE id = ?')
      .bind(status, taskId)
      .run();

    // Log history
    await logTaskHistory(c.env.DB, taskId, user.id, 'status_changed', { status });

    const taskWithTags = await getTaskWithTags(c.env.DB, taskId);

    return c.json<ApiResponse<TaskWithTags>>({ success: true, data: taskWithTags! });
  } catch (error) {
    console.error('Error updating task status:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to update task status' },
      500
    );
  }
});

// Delete task (soft delete)
taskRoutes.delete('/:id', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const taskId = parseInt(c.req.param('id'), 10);

    // Check access (must be owner)
    const access = await checkTaskAccess(c.env.DB, taskId, user.id);
    if (!access.hasAccess || access.permission !== 'owner') {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Only owner can delete task' },
        403
      );
    }

    await c.env.DB.prepare(
      'UPDATE tasks SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?'
    )
      .bind(taskId)
      .run();

    // Log history
    await logTaskHistory(c.env.DB, taskId, user.id, 'deleted');

    return c.json<ApiResponse<{ id: number }>>({ success: true, data: { id: taskId } });
  } catch (error) {
    console.error('Error deleting task:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to delete task' },
      500
    );
  }
});

// Hard delete task
taskRoutes.delete('/:id/hard', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const taskId = parseInt(c.req.param('id'), 10);

    // Check access (must be owner)
    const access = await checkTaskAccess(c.env.DB, taskId, user.id);
    if (!access.hasAccess || access.permission !== 'owner') {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Only owner can hard delete task' },
        403
      );
    }

    await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?')
      .bind(taskId)
      .run();

    return c.json<ApiResponse<{ id: number }>>({ success: true, data: { id: taskId } });
  } catch (error) {
    console.error('Error hard deleting task:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to hard delete task' },
      500
    );
  }
});

// Duplicate task
taskRoutes.post('/:id/duplicate', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const taskId = parseInt(c.req.param('id'), 10);

    // Check access
    const access = await checkTaskAccess(c.env.DB, taskId, user.id);
    if (!access.hasAccess) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Access denied' },
        403
      );
    }

    const originalTask = await getTaskWithTags(c.env.DB, taskId);
    if (!originalTask) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Task not found' }, 404);
    }

    // Create duplicate
    const duplicatedTask = await c.env.DB.prepare(`
      INSERT INTO tasks (
        user_id, title, description, start_datetime, deadline_datetime, priority, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `)
      .bind(
        user.id,
        `${originalTask.title} (Copy)`,
        originalTask.description,
        originalTask.start_datetime,
        originalTask.deadline_datetime,
        originalTask.priority,
        'planned' // Reset status to planned
      )
      .first<Task>();

    // Copy tags
    for (const tag of originalTask.tags) {
      await c.env.DB.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)')
        .bind(duplicatedTask!.id, tag.id)
        .run();
    }

    // Log history
    await logTaskHistory(c.env.DB, duplicatedTask!.id, user.id, 'created');

    const taskWithTags = await getTaskWithTags(c.env.DB, duplicatedTask!.id);

    return c.json<ApiResponse<TaskWithTags>>({ success: true, data: taskWithTags! }, 201);
  } catch (error) {
    console.error('Error duplicating task:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to duplicate task' },
      500
    );
  }
});

// Get task history
taskRoutes.get('/:id/history', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const taskId = parseInt(c.req.param('id'), 10);

    // Check access
    const access = await checkTaskAccess(c.env.DB, taskId, user.id);
    if (!access.hasAccess) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Access denied' },
        403
      );
    }

    const { results: history } = await c.env.DB.prepare(`
      SELECT h.*, u.email, u.display_name
      FROM task_history h
      INNER JOIN users u ON h.user_id = u.id
      WHERE h.task_id = ?
      ORDER BY h.created_at DESC
    `)
      .bind(taskId)
      .all();

    return c.json<ApiResponse<typeof history>>({ success: true, data: history });
  } catch (error) {
    console.error('Error getting task history:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to get task history' },
      500
    );
  }
});

export default taskRoutes;

