// Recurrence API Client
import { auth } from '../config/firebase';
import type {
  TaskRecurrence,
  RecurrenceCreateInput,
  RecurrenceUpdateInput,
  TaskInstance,
  InstanceUpdateInput,
  ApiResponse,
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

class RecurrenceApiClient {
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

  // Create recurrence rule
  async createRecurrence(taskId: number, input: RecurrenceCreateInput): Promise<TaskRecurrence> {
    return this.request<TaskRecurrence>(`/recurrence/${taskId}/recurrence`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // Get recurrence rule
  async getRecurrence(taskId: number): Promise<TaskRecurrence> {
    return this.request<TaskRecurrence>(`/recurrence/${taskId}/recurrence`);
  }

  // Update recurrence rule
  async updateRecurrence(taskId: number, input: RecurrenceUpdateInput): Promise<TaskRecurrence> {
    return this.request<TaskRecurrence>(`/recurrence/${taskId}/recurrence`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  // Delete recurrence rule
  async deleteRecurrence(taskId: number): Promise<{ taskId: number }> {
    return this.request<{ taskId: number }>(`/recurrence/${taskId}/recurrence`, {
      method: 'DELETE',
    });
  }

  // Get instances
  async getInstances(taskId: number): Promise<TaskInstance[]> {
    return this.request<TaskInstance[]>(`/recurrence/${taskId}/instances`);
  }

  // Update instance
  async updateInstance(instanceId: number, input: InstanceUpdateInput): Promise<TaskInstance> {
    return this.request<TaskInstance>(`/recurrence/instances/${instanceId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  // Delete instance
  async deleteInstance(instanceId: number): Promise<{ id: number }> {
    return this.request<{ id: number }>(`/recurrence/instances/${instanceId}`, {
      method: 'DELETE',
    });
  }
}

export const recurrenceApi = new RecurrenceApiClient();

