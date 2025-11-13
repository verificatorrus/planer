import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange, signIn, signUp, signOut } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ 
    success: boolean; 
    error?: string; 
    requiresEmailVerification?: boolean;
  }>;
  register: (email: string, password: string) => Promise<{ 
    success: boolean; 
    error?: string; 
    message?: string;
    requiresEmailVerification?: boolean;
  }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return {
      success: result.success,
      error: result.error,
      requiresEmailVerification: result.requiresEmailVerification,
    };
  };

  const register = async (email: string, password: string) => {
    const result = await signUp(email, password);
    // Don't set user on registration - they need to verify email first
    return {
      success: result.success,
      error: result.error,
      message: result.message,
      requiresEmailVerification: result.requiresEmailVerification,
    };
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

