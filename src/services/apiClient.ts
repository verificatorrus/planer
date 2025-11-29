import { getToken, refreshToken } from './authService';
import type { ApiResponse } from '../../worker/db-types';

export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  unwrapResponse?: boolean;
}

const API_BASE_URL = '/api';

export const apiClient = {
  async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { skipAuth, unwrapResponse = false, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge existing headers
    if (fetchOptions.headers) {
      const existingHeaders = new Headers(fetchOptions.headers);
      existingHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    }

    // Add Authorization header if not skipped
    if (!skipAuth) {
      let token = getToken();
      
      // Try to refresh token if not available
      if (!token) {
        token = await refreshToken();
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();

    // If unwrapResponse is true, handle ApiResponse wrapper
    if (unwrapResponse) {
      const apiResponse = data as ApiResponse<T>;
      if (!apiResponse.success) {
        throw new ApiError(
          apiResponse.error || 'Request failed',
          response.status,
          apiResponse
        );
      }
      return apiResponse.data as T;
    }

    return data;
  },

  get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put<T>(endpoint: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  patch<T>(endpoint: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  },

  // Health check (public endpoint)
  healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health', { skipAuth: true });
  },
};

