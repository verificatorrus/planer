// Database types for D1

// ============================================================================
// APP VERSION (existing)
// ============================================================================
export interface AppVersion {
  id: number;
  version: string;
  build_number: number;
  platform: 'web' | 'android' | 'ios';
  release_date: string;
  notes: string | null;
  is_current: 0 | 1;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// USERS
// ============================================================================
export interface User {
  id: number;
  firebase_uid: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreateInput {
  firebase_uid: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

export interface UserUpdateInput {
  display_name?: string;
  avatar_url?: string;
}

// ============================================================================
// TASKS
// ============================================================================
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'planned' | 'in_progress' | 'done' | 'skipped' | 'canceled';

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  start_datetime: string;
  deadline_datetime: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  is_archived: 0 | 1;
  is_deleted: 0 | 1;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  start_datetime: string;
  deadline_datetime?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  tag_ids?: number[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  start_datetime?: string;
  deadline_datetime?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  tag_ids?: number[];
}

export interface TaskWithTags extends Task {
  tags: Tag[];
}

export interface TaskWithDetails extends TaskWithTags {
  is_shared?: boolean;
  shared_by?: User;
  permission?: 'view' | 'edit';
  recurrence?: TaskRecurrence;
}

// ============================================================================
// TAGS
// ============================================================================
export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface TagCreateInput {
  name: string;
  color?: string;
}

export interface TagUpdateInput {
  name?: string;
  color?: string;
}

// ============================================================================
// TASK-TAGS RELATION
// ============================================================================
export interface TaskTag {
  task_id: number;
  tag_id: number;
  created_at: string;
}

// ============================================================================
// RECURRENCE
// ============================================================================
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'workdays' | 'weekends';
export type RecurrenceEndType = 'never' | 'date' | 'count';

export interface TaskRecurrence {
  id: number;
  task_id: number;
  recurrence_type: RecurrenceType;
  interval_value: number;
  days_of_week: string | null; // JSON array: [0,1,2,3,4] for Mon-Fri
  day_of_month: number | null;
  month_of_year: number | null;
  end_type: RecurrenceEndType;
  end_date: string | null;
  end_count: number | null;
  current_count: number;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface RecurrenceCreateInput {
  recurrence_type: RecurrenceType;
  interval_value?: number;
  days_of_week?: number[]; // Array will be converted to JSON string
  day_of_month?: number;
  month_of_year?: number;
  end_type?: RecurrenceEndType;
  end_date?: string;
  end_count?: number;
}

export interface RecurrenceUpdateInput {
  recurrence_type?: RecurrenceType;
  interval_value?: number;
  days_of_week?: number[];
  day_of_month?: number;
  month_of_year?: number;
  end_type?: RecurrenceEndType;
  end_date?: string;
  end_count?: number;
  is_active?: 0 | 1;
}

// ============================================================================
// TASK INSTANCES
// ============================================================================
export interface TaskInstance {
  id: number;
  parent_task_id: number;
  recurrence_id: number;
  user_id: number;
  scheduled_datetime: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  is_modified: 0 | 1;
  completed_at: string | null;
  skipped_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstanceUpdateInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  scheduled_datetime?: string;
}

// ============================================================================
// SHARING
// ============================================================================
export type SharePermission = 'view' | 'edit';

export interface SharedTask {
  id: number;
  task_id: number;
  owner_user_id: number;
  shared_with_user_id: number;
  permission: SharePermission;
  shared_at: string;
}

export interface ShareTaskInput {
  email: string; // Email of user to share with
  permission: SharePermission;
}

export interface SharedTaskWithDetails extends SharedTask {
  task: Task;
  owner: User;
  shared_with: User;
}

// ============================================================================
// FRIENDS
// ============================================================================
export type FriendStatus = 'pending' | 'accepted' | 'blocked';

export interface UserFriend {
  id: number;
  user_id: number;
  friend_user_id: number;
  status: FriendStatus;
  requested_at: string;
  accepted_at: string | null;
}

export interface FriendWithDetails extends UserFriend {
  friend: User;
}

export interface FriendRequestInput {
  friend_email: string;
}

// ============================================================================
// TASK HISTORY
// ============================================================================
export type HistoryAction = 'created' | 'updated' | 'deleted' | 'status_changed' | 'shared' | 'unshared' | 'restored';

export interface TaskHistory {
  id: number;
  task_id: number;
  user_id: number;
  action: HistoryAction;
  changes: string | null; // JSON string with change details
  created_at: string;
}

export interface TaskHistoryWithUser extends TaskHistory {
  user: User;
}

export interface HistoryChanges {
  field: string;
  old_value: unknown;
  new_value: unknown;
}

// ============================================================================
// API RESPONSES
// ============================================================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  requiresEmailVerification?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface TaskFilters {
  date_from?: string;
  date_to?: string;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  tag_ids?: number[];
  search?: string;
  include_shared?: boolean;
  include_archived?: boolean;
}

export interface CalendarTask {
  id: number;
  title: string;
  start: string;
  end?: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: Tag[];
  is_shared: boolean;
}

