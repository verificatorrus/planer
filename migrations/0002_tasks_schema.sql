-- Migration 0002: Tasks system schema
-- Creates tables for users, tasks, tags, recurrence, sharing, and history

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_datetime DATETIME NOT NULL,
    deadline_datetime DATETIME,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned', 'in_progress', 'done', 'skipped', 'canceled')),
    is_archived INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_start_datetime ON tasks(start_datetime);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_is_deleted ON tasks(is_deleted);
CREATE INDEX IF NOT EXISTS idx_tasks_user_datetime ON tasks(user_id, start_datetime);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);

-- ============================================================================
-- TAGS TABLE (individual per user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#808080',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- ============================================================================
-- TASK-TAGS RELATION (many-to-many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_tags (
    task_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, tag_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);

-- ============================================================================
-- TASK RECURRENCE RULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_recurrence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    recurrence_type TEXT NOT NULL CHECK(recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly', 'custom', 'workdays', 'weekends')),
    interval_value INTEGER DEFAULT 1,
    days_of_week TEXT,
    day_of_month INTEGER,
    month_of_year INTEGER,
    end_type TEXT NOT NULL DEFAULT 'never' CHECK(end_type IN ('never', 'date', 'count')),
    end_date DATETIME,
    end_count INTEGER,
    current_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recurrence_task_id ON task_recurrence(task_id);
CREATE INDEX IF NOT EXISTS idx_recurrence_is_active ON task_recurrence(is_active);

-- ============================================================================
-- TASK INSTANCES (for recurring tasks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_task_id INTEGER NOT NULL,
    recurrence_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    scheduled_datetime DATETIME NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned', 'in_progress', 'done', 'skipped', 'canceled')),
    is_modified INTEGER DEFAULT 0,
    completed_at DATETIME,
    skipped_at DATETIME,
    canceled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (recurrence_id) REFERENCES task_recurrence(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_instances_parent_task ON task_instances(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_instances_recurrence ON task_instances(recurrence_id);
CREATE INDEX IF NOT EXISTS idx_instances_user_id ON task_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_instances_scheduled ON task_instances(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_instances_user_scheduled ON task_instances(user_id, scheduled_datetime);

-- ============================================================================
-- SHARED TASKS (sharing between users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS shared_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    owner_user_id INTEGER NOT NULL,
    shared_with_user_id INTEGER NOT NULL,
    permission TEXT NOT NULL DEFAULT 'view' CHECK(permission IN ('view', 'edit')),
    shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(task_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_tasks_task_id ON shared_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_shared_tasks_owner ON shared_tasks(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_tasks_shared_with ON shared_tasks(shared_with_user_id);

-- ============================================================================
-- USER FRIENDS (for easier sharing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'blocked')),
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, friend_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON user_friends(friend_user_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON user_friends(status);

-- ============================================================================
-- TASK HISTORY (audit log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('created', 'updated', 'deleted', 'status_changed', 'shared', 'unshared', 'restored')),
    changes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created ON task_history(created_at);

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================

-- Users
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Tasks
CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
AFTER UPDATE ON tasks
BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Tags
CREATE TRIGGER IF NOT EXISTS update_tags_timestamp 
AFTER UPDATE ON tags
BEGIN
    UPDATE tags SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Task Recurrence
CREATE TRIGGER IF NOT EXISTS update_recurrence_timestamp 
AFTER UPDATE ON task_recurrence
BEGIN
    UPDATE task_recurrence SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Task Instances
CREATE TRIGGER IF NOT EXISTS update_instances_timestamp 
AFTER UPDATE ON task_instances
BEGIN
    UPDATE task_instances SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

