// Database helper functions
import type { D1Database } from '@cloudflare/workers-types';
import type { User } from '../db-types';

/**
 * Get or create user from Firebase UID
 */
export async function ensureUser(
  db: D1Database,
  firebaseUid: string,
  email: string,
  displayName?: string
): Promise<User> {
  // Try to find existing user
  let user = await db
    .prepare('SELECT * FROM users WHERE firebase_uid = ?')
    .bind(firebaseUid)
    .first<User>();

  if (!user) {
    // Create new user
    const result = await db
      .prepare(
        'INSERT INTO users (firebase_uid, email, display_name) VALUES (?, ?, ?) RETURNING *'
      )
      .bind(firebaseUid, email, displayName || null)
      .first<User>();

    user = result!;
  }

  return user;
}

/**
 * Get user by Firebase UID
 */
export async function getUserByFirebaseUid(
  db: D1Database,
  firebaseUid: string
): Promise<User | null> {
  return await db
    .prepare('SELECT * FROM users WHERE firebase_uid = ?')
    .bind(firebaseUid)
    .first<User>();
}

/**
 * Get user by email
 */
export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<User | null> {
  return await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<User>();
}

/**
 * Check if user has access to task (owner or shared with)
 */
export async function checkTaskAccess(
  db: D1Database,
  taskId: number,
  userId: number
): Promise<{ hasAccess: boolean; permission: 'owner' | 'view' | 'edit' | null }> {
  // Check if user is owner
  const task = await db
    .prepare('SELECT user_id FROM tasks WHERE id = ? AND is_deleted = 0')
    .bind(taskId)
    .first<{ user_id: number }>();

  if (!task) {
    return { hasAccess: false, permission: null };
  }

  if (task.user_id === userId) {
    return { hasAccess: true, permission: 'owner' };
  }

  // Check if task is shared with user
  const sharedTask = await db
    .prepare('SELECT permission FROM shared_tasks WHERE task_id = ? AND shared_with_user_id = ?')
    .bind(taskId, userId)
    .first<{ permission: 'view' | 'edit' }>();

  if (sharedTask) {
    return { hasAccess: true, permission: sharedTask.permission };
  }

  return { hasAccess: false, permission: null };
}

/**
 * Log task history
 */
export async function logTaskHistory(
  db: D1Database,
  taskId: number,
  userId: number,
  action: string,
  changes?: unknown
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO task_history (task_id, user_id, action, changes) VALUES (?, ?, ?, ?)'
    )
    .bind(taskId, userId, action, changes ? JSON.stringify(changes) : null)
    .run();
}

/**
 * Build WHERE clause for task filters
 */
export function buildTaskFilters(
  userId: number,
  filters: {
    date_from?: string;
    date_to?: string;
    status?: string | string[];
    priority?: string | string[];
    tag_ids?: number[];
    search?: string;
    include_shared?: boolean;
    include_archived?: boolean;
  }
): { where: string; bindings: unknown[] } {
  const conditions: string[] = [];
  const bindings: unknown[] = [];

  // Base condition: user's own tasks or shared tasks
  if (filters.include_shared) {
    conditions.push(
      '(tasks.user_id = ? OR tasks.id IN (SELECT task_id FROM shared_tasks WHERE shared_with_user_id = ?))'
    );
    bindings.push(userId, userId);
  } else {
    conditions.push('tasks.user_id = ?');
    bindings.push(userId);
  }

  // Not deleted
  conditions.push('tasks.is_deleted = 0');

  // Archived filter
  if (!filters.include_archived) {
    conditions.push('tasks.is_archived = 0');
  }

  // Date range
  if (filters.date_from) {
    conditions.push('tasks.start_datetime >= ?');
    bindings.push(filters.date_from);
  }
  if (filters.date_to) {
    conditions.push('tasks.start_datetime <= ?');
    bindings.push(filters.date_to);
  }

  // Status filter
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      conditions.push(`tasks.status IN (${filters.status.map(() => '?').join(',')})`);
      bindings.push(...filters.status);
    } else {
      conditions.push('tasks.status = ?');
      bindings.push(filters.status);
    }
  }

  // Priority filter
  if (filters.priority) {
    if (Array.isArray(filters.priority)) {
      conditions.push(`tasks.priority IN (${filters.priority.map(() => '?').join(',')})`);
      bindings.push(...filters.priority);
    } else {
      conditions.push('tasks.priority = ?');
      bindings.push(filters.priority);
    }
  }

  // Search in title and description
  if (filters.search) {
    conditions.push('(tasks.title LIKE ? OR tasks.description LIKE ?)');
    const searchPattern = `%${filters.search}%`;
    bindings.push(searchPattern, searchPattern);
  }

  // Tag filter (handled separately with JOIN)

  return {
    where: conditions.join(' AND '),
    bindings,
  };
}

