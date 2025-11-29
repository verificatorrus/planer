// User API Client
import { apiClient } from './apiClient';
import type { User, UserUpdateInput } from '../../worker/db-types';

class UserApiClient {
  // Sync user with database
  async syncUser(): Promise<User> {
    return apiClient.post<User>('/users/sync', undefined, { unwrapResponse: true });
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/users/me', { unwrapResponse: true });
  }

  // Update current user
  async updateUser(input: UserUpdateInput): Promise<User> {
    return apiClient.put<User>('/users/me', input, { unwrapResponse: true });
  }

  // Search users by email
  async searchUsers(query: string): Promise<Partial<User>[]> {
    return apiClient.get<Partial<User>[]>(`/users/search?q=${encodeURIComponent(query)}`, { unwrapResponse: true });
  }
}

export const userApi = new UserApiClient();
