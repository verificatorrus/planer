// User API routes
import { Hono } from 'hono';
import { getFirebaseToken } from '@hono/firebase-auth';
import type { VerifyFirebaseAuthEnv } from '@hono/firebase-auth';
import type { User, ApiResponse, UserUpdateInput } from '../db-types';
import { ensureUser, getUserByFirebaseUid } from '../utils/db-helpers';

type Bindings = Env & VerifyFirebaseAuthEnv;
const userRoutes = new Hono<{ Bindings: Bindings }>();

// Sync/create user from Firebase
userRoutes.post('/sync', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await ensureUser(
      c.env.DB,
      idToken.uid,
      idToken.email!,
      idToken.name
    );

    return c.json<ApiResponse<User>>({ success: true, data: user });
  } catch (error) {
    console.error('Error syncing user:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to sync user' },
      500
    );
  }
});

// Get current user profile
userRoutes.get('/me', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);

    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    return c.json<ApiResponse<User>>({ success: true, data: user });
  } catch (error) {
    console.error('Error getting user:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to get user' },
      500
    );
  }
});

// Update current user profile
userRoutes.put('/me', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await getUserByFirebaseUid(c.env.DB, idToken.uid);
    if (!user) {
      return c.json<ApiResponse<never>>({ success: false, error: 'User not found' }, 404);
    }

    const body = await c.req.json<UserUpdateInput>();

    const updates: string[] = [];
    const bindings: unknown[] = [];

    if (body.display_name !== undefined) {
      updates.push('display_name = ?');
      bindings.push(body.display_name);
    }
    if (body.avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      bindings.push(body.avatar_url);
    }

    if (updates.length === 0) {
      return c.json<ApiResponse<User>>({ success: true, data: user });
    }

    bindings.push(user.id);

    const updatedUser = await c.env.DB.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ? RETURNING *`
    )
      .bind(...bindings)
      .first<User>();

    return c.json<ApiResponse<User>>({ success: true, data: updatedUser! });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to update user' },
      500
    );
  }
});

// Search users by email (for sharing)
userRoutes.get('/search', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    if (!idToken) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, 401);
    }

    const query = c.req.query('q');
    if (!query) {
      return c.json<ApiResponse<never>>(
        { success: false, error: 'Query parameter "q" is required' },
        400
      );
    }

    const { results } = await c.env.DB.prepare(
      'SELECT id, email, display_name, avatar_url FROM users WHERE email LIKE ? LIMIT 20'
    )
      .bind(`%${query}%`)
      .all<Omit<User, 'firebase_uid' | 'created_at' | 'updated_at'>>();

    return c.json<ApiResponse<typeof results>>({ success: true, data: results });
  } catch (error) {
    console.error('Error searching users:', error);
    return c.json<ApiResponse<never>>(
      { success: false, error: 'Failed to search users' },
      500
    );
  }
});

export default userRoutes;

