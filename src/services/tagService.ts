// Tag API Client
import { auth } from '../config/firebase';
import type { Tag, TagCreateInput, TagUpdateInput, ApiResponse } from '../../worker/db-types';

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

class TagApiClient {
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

  // Create tag
  async createTag(input: TagCreateInput): Promise<Tag> {
    return this.request<Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // Get all tags
  async getTags(): Promise<Tag[]> {
    return this.request<Tag[]>('/tags');
  }

  // Get single tag
  async getTag(id: number): Promise<Tag> {
    return this.request<Tag>(`/tags/${id}`);
  }

  // Update tag
  async updateTag(id: number, input: TagUpdateInput): Promise<Tag> {
    return this.request<Tag>(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  // Delete tag
  async deleteTag(id: number): Promise<{ id: number }> {
    return this.request<{ id: number }>(`/tags/${id}`, {
      method: 'DELETE',
    });
  }

  // Get task count for tag
  async getTagCount(id: number): Promise<{ count: number }> {
    return this.request<{ count: number }>(`/tags/${id}/count`);
  }
}

export const tagApi = new TagApiClient();
