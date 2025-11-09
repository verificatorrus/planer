// Database types for D1

export interface AppVersion {
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

