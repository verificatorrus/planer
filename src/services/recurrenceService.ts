// Recurrence API Client
import { apiClient } from './apiClient';
import type {
  TaskRecurrence,
  RecurrenceCreateInput,
  RecurrenceUpdateInput,
  TaskInstance,
  InstanceUpdateInput,
} from '../../worker/db-types';

class RecurrenceApiClient {
  // Create recurrence rule
  async createRecurrence(taskId: number, input: RecurrenceCreateInput): Promise<TaskRecurrence> {
    return apiClient.post<TaskRecurrence>(`/recurrence/${taskId}/recurrence`, input, { unwrapResponse: true });
  }

  // Get recurrence rule
  async getRecurrence(taskId: number): Promise<TaskRecurrence> {
    return apiClient.get<TaskRecurrence>(`/recurrence/${taskId}/recurrence`, { unwrapResponse: true });
  }

  // Update recurrence rule
  async updateRecurrence(taskId: number, input: RecurrenceUpdateInput): Promise<TaskRecurrence> {
    return apiClient.put<TaskRecurrence>(`/recurrence/${taskId}/recurrence`, input, { unwrapResponse: true });
  }

  // Delete recurrence rule
  async deleteRecurrence(taskId: number): Promise<{ taskId: number }> {
    return apiClient.delete<{ taskId: number }>(`/recurrence/${taskId}/recurrence`, { unwrapResponse: true });
  }

  // Get instances
  async getInstances(taskId: number): Promise<TaskInstance[]> {
    return apiClient.get<TaskInstance[]>(`/recurrence/${taskId}/instances`, { unwrapResponse: true });
  }

  // Update instance
  async updateInstance(instanceId: number, input: InstanceUpdateInput): Promise<TaskInstance> {
    return apiClient.put<TaskInstance>(`/recurrence/instances/${instanceId}`, input, { unwrapResponse: true });
  }

  // Delete instance
  async deleteInstance(instanceId: number): Promise<{ id: number }> {
    return apiClient.delete<{ id: number }>(`/recurrence/instances/${instanceId}`, { unwrapResponse: true });
  }
}

export const recurrenceApi = new RecurrenceApiClient();
