// Recurrence API endpoints
import { Hono } from 'hono';
import { getFirebaseToken } from '@hono/firebase-auth';
import type { VerifyFirebaseAuthEnv } from '@hono/firebase-auth';
import type {
  TaskRecurrence,
  RecurrenceCreateInput,
  RecurrenceUpdateInput,
  TaskInstance,
  InstanceUpdateInput,
  ApiResponse,
} from '../db-types';
import { getUserByFirebaseUid, checkTaskAccess } from '../utils/db-helpers';
import { generateTaskInstances } from '../utils/recurrence-helpers';

type Bindings = Env & VerifyFirebaseAuthEnv;
const recurrenceRoutes = new Hono<{ Bindings: Bindings }>();

// Create recurrence rule for a task
recurrenceRoutes.post('/:taskId/recurrence', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const taskId = parseInt(c.req.param('taskId'), 10);

    // Check access (must be owner)
    const access = await checkTaskAccess(c.env.DB, taskId, user.id);
    if (!access.hasAccess || access.permission !== 'owner') {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Only owner can create recurrence' },
        403
      );
    }

    const body = await c.req.json<RecurrenceCreateInput>();

    // Check if recurrence already exists for this task
    const existing = await c.env.DB.prepare(
      'SELECT id FROM task_recurrence WHERE task_id = ?'
    )
      .bind(taskId)
      .first();

    if (existing) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Recurrence rule already exists for this task' },
        400
      );
    }

    // Create recurrence rule
    const recurrence = await c.env.DB.prepare(`
      INSERT INTO task_recurrence (
        task_id, recurrence_type, interval_value, days_of_week,
        day_of_month, month_of_year, end_type, end_date, end_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `)
      .bind(
        taskId,
        body.recurrence_type,
        body.interval_value || 1,
        body.days_of_week ? JSON.stringify(body.days_of_week) : null,
        body.day_of_month || null,
        body.month_of_year || null,
        body.end_type || 'never',
        body.end_date || null,
        body.end_count || null
      )
      .first<TaskRecurrence>();

    // Generate initial instances
    await generateTaskInstances(c.env.DB, taskId, recurrence!.id, user.id);

    return c.json<ApiResponse<TaskRecurrence>>({ success: true, data: recurrence! }, 201);
  } catch (error) {
    console.error('Error creating recurrence:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to create recurrence' },
      500
    );
  }
});

// Get recurrence rule for a task
recurrenceRoutes.get('/:taskId/recurrence', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const taskId = parseInt(c.req.param('taskId'), 10);

    // Check access
    const access = await checkTaskAccess(c.env.DB, taskId, user.id);
    if (!access.hasAccess) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Access denied' }, 403);
    }

    const recurrence = await c.env.DB.prepare(
      'SELECT * FROM task_recurrence WHERE task_id = ?'
    )
      .bind(taskId)
      .first<TaskRecurrence>();

    if (!recurrence) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Recurrence not found' },
        404
      );
    }

    return c.json<ApiResponse<TaskRecurrence>>({ success: true, data: recurrence });
  } catch (error) {
    console.error('Error getting recurrence:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to get recurrence' },
      500
    );
  }
});

// Update recurrence rule
recurrenceRoutes.put('/:taskId/recurrence', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const taskId = parseInt(c.req.param('taskId'), 10);

    // Check access (must be owner)
    const access = await checkTaskAccess(c.env.DB, taskId, user.id);
    if (!access.hasAccess || access.permission !== 'owner') {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Only owner can update recurrence' },
        403
      );
    }

    const body = await c.req.json<RecurrenceUpdateInput>();

    const updates: string[] = [];
    const bindings: unknown[] = [];

    if (body.recurrence_type !== undefined) {
      updates.push('recurrence_type = ?');
      bindings.push(body.recurrence_type);
    }
    if (body.interval_value !== undefined) {
      updates.push('interval_value = ?');
      bindings.push(body.interval_value);
    }
    if (body.days_of_week !== undefined) {
      updates.push('days_of_week = ?');
      bindings.push(JSON.stringify(body.days_of_week));
    }
    if (body.day_of_month !== undefined) {
      updates.push('day_of_month = ?');
      bindings.push(body.day_of_month);
    }
    if (body.month_of_year !== undefined) {
      updates.push('month_of_year = ?');
      bindings.push(body.month_of_year);
    }
    if (body.end_type !== undefined) {
      updates.push('end_type = ?');
      bindings.push(body.end_type);
    }
    if (body.end_date !== undefined) {
      updates.push('end_date = ?');
      bindings.push(body.end_date);
    }
    if (body.end_count !== undefined) {
      updates.push('end_count = ?');
      bindings.push(body.end_count);
    }
    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      bindings.push(body.is_active);
    }

    if (updates.length === 0) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'No updates provided' },
        400
      );
    }

    bindings.push(taskId);

    const recurrence = await c.env.DB.prepare(
      `UPDATE task_recurrence SET ${updates.join(', ')} WHERE task_id = ? RETURNING *`
    )
      .bind(...bindings)
      .first<TaskRecurrence>();

    if (!recurrence) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Recurrence not found' },
        404
      );
    }

    // Regenerate instances if rule changed
    if (body.is_active !== 0) {
      await generateTaskInstances(c.env.DB, taskId, recurrence.id, user.id);
    }

    return c.json<ApiResponse<TaskRecurrence>>({ success: true, data: recurrence });
  } catch (error) {
    console.error('Error updating recurrence:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to update recurrence' },
      500
    );
  }
});

// Delete recurrence rule
recurrenceRoutes.delete('/:taskId/recurrence', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const taskId = parseInt(c.req.param('taskId'), 10);

    // Check access (must be owner)
    const access = await checkTaskAccess(c.env.DB, taskId, user.id);
    if (!access.hasAccess || access.permission !== 'owner') {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Only owner can delete recurrence' },
        403
      );
    }

    await c.env.DB.prepare('DELETE FROM task_recurrence WHERE task_id = ?')
      .bind(taskId)
      .run();

    return c.json<ApiResponse<{ taskId: number }>>({ success: true, data: { taskId } });
  } catch (error) {
    console.error('Error deleting recurrence:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to delete recurrence' },
      500
    );
  }
});

// Get instances for a task
recurrenceRoutes.get('/:taskId/instances', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const taskId = parseInt(c.req.param('taskId'), 10);

    // Check access
    const access = await checkTaskAccess(c.env.DB, taskId, user.id);
    if (!access.hasAccess) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Access denied' }, 403);
    }

    const { results: instances } = await c.env.DB.prepare(`
      SELECT * FROM task_instances
      WHERE parent_task_id = ?
      ORDER BY scheduled_datetime ASC
    `)
      .bind(taskId)
      .all<TaskInstance>();

    return c.json<ApiResponse<TaskInstance[]>>({ success: true, data: instances });
  } catch (error) {
    console.error('Error getting instances:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to get instances' },
      500
    );
  }
});

// Update single instance
recurrenceRoutes.put('/instances/:instanceId', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const instanceId = parseInt(c.req.param('instanceId'), 10);

    // Get instance and check ownership
    const instance = await c.env.DB.prepare(
      'SELECT * FROM task_instances WHERE id = ? AND user_id = ?'
    )
      .bind(instanceId, user.id)
      .first<TaskInstance>();

    if (!instance) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Instance not found' },
        404
      );
    }

    const body = await c.req.json<InstanceUpdateInput>();

    const updates: string[] = ['is_modified = 1'];
    const bindings: unknown[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      bindings.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      bindings.push(body.description);
    }
    if (body.priority !== undefined) {
      updates.push('priority = ?');
      bindings.push(body.priority);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      bindings.push(body.status);

      // Update completion/skip/cancel timestamps
      if (body.status === 'done') {
        updates.push('completed_at = CURRENT_TIMESTAMP');
      } else if (body.status === 'skipped') {
        updates.push('skipped_at = CURRENT_TIMESTAMP');
      } else if (body.status === 'canceled') {
        updates.push('canceled_at = CURRENT_TIMESTAMP');
      }
    }
    if (body.scheduled_datetime !== undefined) {
      updates.push('scheduled_datetime = ?');
      bindings.push(body.scheduled_datetime);
    }

    bindings.push(instanceId);

    const updatedInstance = await c.env.DB.prepare(
      `UPDATE task_instances SET ${updates.join(', ')} WHERE id = ? RETURNING *`
    )
      .bind(...bindings)
      .first<TaskInstance>();

    return c.json<ApiResponse<TaskInstance>>({ success: true, data: updatedInstance! });
  } catch (error) {
    console.error('Error updating instance:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to update instance' },
      500
    );
  }
});

// Delete single instance
recurrenceRoutes.delete('/instances/:instanceId', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const instanceId = parseInt(c.req.param('instanceId'), 10);

    // Check ownership
    const instance = await c.env.DB.prepare(
      'SELECT id FROM task_instances WHERE id = ? AND user_id = ?'
    )
      .bind(instanceId, user.id)
      .first();

    if (!instance) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Instance not found' },
        404
      );
    }

    await c.env.DB.prepare('DELETE FROM task_instances WHERE id = ?')
      .bind(instanceId)
      .run();

    return c.json<ApiResponse<{ id: number }>>({ success: true, data: { id: instanceId } });
  } catch (error) {
    console.error('Error deleting instance:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to delete instance' },
      500
    );
  }
});

export default recurrenceRoutes;

