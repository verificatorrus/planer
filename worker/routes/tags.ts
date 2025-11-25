// Tags API routes
import { Hono } from 'hono';
import { getFirebaseToken } from '@hono/firebase-auth';
import type { VerifyFirebaseAuthEnv } from '@hono/firebase-auth';
import type { Tag, TagCreateInput, TagUpdateInput, ApiResponse } from '../db-types';
import { getUserByFirebaseUid } from '../utils/db-helpers';

type Bindings = Env & VerifyFirebaseAuthEnv;
const tagRoutes = new Hono<{ Bindings: Bindings }>();

// Create tag
tagRoutes.post('/', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const body = await c.req.json<TagCreateInput>();

    if (!body.name) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Tag name is required' },
        400
      );
    }

    // Check if tag with same name already exists for this user
    const existing = await c.env.DB.prepare(
      'SELECT id FROM tags WHERE user_id = ? AND name = ?'
    )
      .bind(user.id, body.name)
      .first();

    if (existing) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Tag with this name already exists' },
        400
      );
    }

    const tag = await c.env.DB.prepare(`
      INSERT INTO tags (user_id, name, color)
      VALUES (?, ?, ?)
      RETURNING *
    `)
      .bind(user.id, body.name, body.color || '#808080')
      .first<Tag>();

    return c.json<ApiResponse<Tag>>({ success: true, data: tag! }, 201);
  } catch (error) {
    console.error('Error creating tag:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to create tag' },
      500
    );
  }
});

// Get all user's tags
tagRoutes.get('/', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const { results: tags } = await c.env.DB.prepare(
      'SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC'
    )
      .bind(user.id)
      .all<Tag>();

    return c.json<ApiResponse<Tag[]>>({ success: true, data: tags });
  } catch (error) {
    console.error('Error getting tags:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to get tags' },
      500
    );
  }
});

// Get single tag
tagRoutes.get('/:id', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const tagId = parseInt(c.req.param('id'), 10);

    const tag = await c.env.DB.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?')
      .bind(tagId, user.id)
      .first<Tag>();

    if (!tag) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Tag not found' }, 404);
    }

    return c.json<ApiResponse<Tag>>({ success: true, data: tag });
  } catch (error) {
    console.error('Error getting tag:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to get tag' },
      500
    );
  }
});

// Update tag
tagRoutes.put('/:id', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const tagId = parseInt(c.req.param('id'), 10);

    // Check ownership
    const existing = await c.env.DB.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?')
      .bind(tagId, user.id)
      .first<Tag>();

    if (!existing) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Tag not found' }, 404);
    }

    const body = await c.req.json<TagUpdateInput>();

    const updates: string[] = [];
    const bindings: unknown[] = [];

    if (body.name !== undefined) {
      // Check if new name conflicts with existing tag
      if (body.name !== existing.name) {
        const conflict = await c.env.DB.prepare(
          'SELECT id FROM tags WHERE user_id = ? AND name = ? AND id != ?'
        )
          .bind(user.id, body.name, tagId)
          .first();

        if (conflict) {
          return c.json<ApiResponse<never>>(
            { success: false, error: 'Tag with this name already exists' },
            400
          );
        }
      }

      updates.push('name = ?');
      bindings.push(body.name);
    }

    if (body.color !== undefined) {
      updates.push('color = ?');
      bindings.push(body.color);
    }

    if (updates.length === 0) {
      return c.json<ApiResponse<Tag>>({ success: true, data: existing });
    }

    bindings.push(tagId);

    const updatedTag = await c.env.DB.prepare(
      `UPDATE tags SET ${updates.join(', ')} WHERE id = ? RETURNING *`
    )
      .bind(...bindings)
      .first<Tag>();

    return c.json<ApiResponse<Tag>>({ success: true, data: updatedTag! });
  } catch (error) {
    console.error('Error updating tag:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to update tag' },
      500
    );
  }
});

// Delete tag
tagRoutes.delete('/:id', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const tagId = parseInt(c.req.param('id'), 10);

    // Check ownership
    const tag = await c.env.DB.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?')
      .bind(tagId, user.id)
      .first<Tag>();

    if (!tag) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Tag not found' }, 404);
    }

    // Delete tag (cascades to task_tags)
    await c.env.DB.prepare('DELETE FROM tags WHERE id = ?')
      .bind(tagId)
      .run();

    return c.json<ApiResponse<{ id: number }>>({ success: true, data: { id: tagId } });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to delete tag' },
      500
    );
  }
});

// Get tasks count for each tag
tagRoutes.get('/:id/count', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const tagId = parseInt(c.req.param('id'), 10);

    // Check ownership
    const tag = await c.env.DB.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?')
      .bind(tagId, user.id)
      .first<Tag>();

    if (!tag) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Tag not found' }, 404);
    }

    const result = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM task_tags tt
      INNER JOIN tasks t ON tt.task_id = t.id
      WHERE tt.tag_id = ? AND t.is_deleted = 0
    `)
      .bind(tagId)
      .first<{ count: number }>();

    return c.json<ApiResponse<{ count: number }>>({
      success: true,
      data: { count: result?.count || 0 },
    });
  } catch (error) {
    console.error('Error getting tag count:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to get tag count' },
      500
    );
  }
});

export default tagRoutes;

