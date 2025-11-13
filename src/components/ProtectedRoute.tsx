import type { ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { AuthPage } from './Auth/AuthPage';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <>{children}</>;
};

