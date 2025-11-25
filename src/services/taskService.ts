// Task API Client
import { auth } from '../config/firebase';
import type {
  TaskCreateInput,
  TaskUpdateInput,
  TaskWithTags,
  ApiResponse,
  TaskFilters,
} from '../../worker/db-types';

const API_BASE = import.meta.env.PROD ? '/api' : '/api';

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

class TaskApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data.data as T;
  }

  // Create task
  async createTask(input: TaskCreateInput): Promise<TaskWithTags> {
    return this.request<TaskWithTags>('/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // Get all tasks with filters
  async getTasks(filters?: TaskFilters): Promise<TaskWithTags[]> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          params.append('status', filters.status.join(','));
        } else {
          params.append('status', filters.status);
        }
      }
      if (filters.priority) {
        if (Array.isArray(filters.priority)) {
          params.append('priority', filters.priority.join(','));
        } else {
          params.append('priority', filters.priority);
        }
      }
      if (filters.tag_ids && filters.tag_ids.length > 0) {
        params.append('tag_ids', filters.tag_ids.join(','));
      }
      if (filters.search) params.append('search', filters.search);
      if (filters.include_shared) params.append('include_shared', 'true');
      if (filters.include_archived) params.append('include_archived', 'true');
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';

    return this.request<TaskWithTags[]>(endpoint);
  }

  // Get single task
  async getTask(id: number): Promise<TaskWithTags> {
    return this.request<TaskWithTags>(`/tasks/${id}`);
  }

  // Update task
  async updateTask(id: number, input: TaskUpdateInput): Promise<TaskWithTags> {
    return this.request<TaskWithTags>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  // Update task status
  async updateTaskStatus(id: number, status: string): Promise<TaskWithTags> {
    return this.request<TaskWithTags>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Delete task (soft)
  async deleteTask(id: number): Promise<{ id: number }> {
    return this.request<{ id: number }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Hard delete task
  async hardDeleteTask(id: number): Promise<{ id: number }> {
    return this.request<{ id: number }>(`/tasks/${id}/hard`, {
      method: 'DELETE',
    });
  }

  // Duplicate task
  async duplicateTask(id: number): Promise<TaskWithTags> {
    return this.request<TaskWithTags>(`/tasks/${id}/duplicate`, {
      method: 'POST',
    });
  }

  // Get task history
  async getTaskHistory(id: number): Promise<unknown[]> {
    return this.request<unknown[]>(`/tasks/${id}/history`);
  }

  // Get tasks for specific day
  async getTasksForDay(date: string): Promise<TaskWithTags[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getTasks({
      date_from: startOfDay.toISOString(),
      date_to: endOfDay.toISOString(),
    });
  }

  // Get tasks for week
  async getTasksForWeek(startDate: string): Promise<TaskWithTags[]> {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return this.getTasks({
      date_from: start.toISOString(),
      date_to: end.toISOString(),
    });
  }

  // Get tasks for month
  async getTasksForMonth(year: number, month: number): Promise<TaskWithTags[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    return this.getTasks({
      date_from: start.toISOString(),
      date_to: end.toISOString(),
    });
  }
}

export const taskApi = new TaskApiClient();
