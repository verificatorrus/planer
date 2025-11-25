// User API Client
import { auth } from '../config/firebase';
import type { User, UserUpdateInput, ApiResponse } from '../../worker/db-types';

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

class UserApiClient {
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

  // Sync user with database
  async syncUser(): Promise<User> {
    return this.request<User>('/users/sync', {
      method: 'POST',
    });
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }

  // Update current user
  async updateUser(input: UserUpdateInput): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  // Search users by email
  async searchUsers(query: string): Promise<Partial<User>[]> {
    return this.request<Partial<User>[]>(`/users/search?q=${encodeURIComponent(query)}`);
  }
}

export const userApi = new UserApiClient();
