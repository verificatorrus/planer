// Tag API Client
import { apiClient } from './apiClient';
import type { Tag, TagCreateInput, TagUpdateInput } from '../../worker/db-types';

class TagApiClient {
  // Create tag
  async createTag(input: TagCreateInput): Promise<Tag> {
    return apiClient.post<Tag>('/tags', input, { unwrapResponse: true });
  }

  // Get all tags
  async getTags(): Promise<Tag[]> {
    return apiClient.get<Tag[]>('/tags', { unwrapResponse: true });
  }

  // Get single tag
  async getTag(id: number): Promise<Tag> {
    return apiClient.get<Tag>(`/tags/${id}`, { unwrapResponse: true });
  }

  // Update tag
  async updateTag(id: number, input: TagUpdateInput): Promise<Tag> {
    return apiClient.put<Tag>(`/tags/${id}`, input, { unwrapResponse: true });
  }

  // Delete tag
  async deleteTag(id: number): Promise<{ id: number }> {
    return apiClient.delete<{ id: number }>(`/tags/${id}`, { unwrapResponse: true });
  }

  // Get task count for tag
  async getTagCount(id: number): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>(`/tags/${id}/count`, { unwrapResponse: true });
  }
}

export const tagApi = new TagApiClient();
