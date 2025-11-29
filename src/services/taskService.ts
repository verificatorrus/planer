// Task API Client
import { apiClient } from './apiClient';
import type {
  TaskCreateInput,
  TaskUpdateInput,
  TaskWithTags,
  TaskFilters,
} from '../../worker/db-types';

class TaskApiClient {
  // Create task
  async createTask(input: TaskCreateInput): Promise<TaskWithTags> {
    return apiClient.post<TaskWithTags>('/tasks', input, { unwrapResponse: true });
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

    return apiClient.get<TaskWithTags[]>(endpoint, { unwrapResponse: true });
  }

  // Get single task
  async getTask(id: number): Promise<TaskWithTags> {
    return apiClient.get<TaskWithTags>(`/tasks/${id}`, { unwrapResponse: true });
  }

  // Update task
  async updateTask(id: number, input: TaskUpdateInput): Promise<TaskWithTags> {
    return apiClient.put<TaskWithTags>(`/tasks/${id}`, input, { unwrapResponse: true });
  }

  // Update task status
  async updateTaskStatus(id: number, status: string): Promise<TaskWithTags> {
    return apiClient.patch<TaskWithTags>(`/tasks/${id}/status`, { status }, { unwrapResponse: true });
  }

  // Delete task (soft)
  async deleteTask(id: number): Promise<{ id: number }> {
    return apiClient.delete<{ id: number }>(`/tasks/${id}`, { unwrapResponse: true });
  }

  // Hard delete task
  async hardDeleteTask(id: number): Promise<{ id: number }> {
    return apiClient.delete<{ id: number }>(`/tasks/${id}/hard`, { unwrapResponse: true });
  }

  // Restore task from archive
  async restoreTask(id: number): Promise<TaskWithTags> {
    return apiClient.patch<TaskWithTags>(`/tasks/${id}/restore`, undefined, { unwrapResponse: true });
  }

  // Duplicate task
  async duplicateTask(id: number): Promise<TaskWithTags> {
    return apiClient.post<TaskWithTags>(`/tasks/${id}/duplicate`, undefined, { unwrapResponse: true });
  }

  // Get task history
  async getTaskHistory(id: number): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`/tasks/${id}/history`, { unwrapResponse: true });
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
