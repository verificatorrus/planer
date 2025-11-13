import { useState, useEffect } from 'react';
import { apiClient, ApiError } from '../services/apiClient';

interface AppVersion {
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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const useAppVersion = () => {
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<ApiResponse<AppVersion>>('/version');
        if (response.success && response.data) {
          setVersion(response.data);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to fetch version');
        }
        console.error('Error fetching version:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
  }, []);

  return { version, loading, error };
};

export const useAppVersions = () => {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<ApiResponse<AppVersion[]>>('/versions');
        if (response.success && response.data) {
          setVersions(response.data);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to fetch versions');
        }
        console.error('Error fetching versions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, []);

  return { versions, loading, error };
};

