import { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Login } from './Login';
import { Register } from './Register';
import { ForgotPassword } from './ForgotPassword';
import { useThemeMode } from '../../hooks/useThemeMode';

type AuthMode = 'login' | 'register' | 'forgot-password';

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const { theme, themeMode, activeMode, toggleTheme } = useThemeMode();

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const handleForgotPassword = () => {
    setMode('forgot-password');
  };

  const handleBackToLogin = () => {
    setMode('login');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {mode === 'forgot-password' ? (
        <ForgotPassword 
          onBackToLogin={handleBackToLogin} 
          toggleTheme={toggleTheme}
          themeMode={themeMode}
          activeMode={activeMode}
        />
      ) : mode === 'login' ? (
        <Login 
          onToggleMode={handleToggleMode} 
          onForgotPassword={handleForgotPassword}
          toggleTheme={toggleTheme}
          themeMode={themeMode}
          activeMode={activeMode}
        />
      ) : (
        <Register 
          onToggleMode={handleToggleMode}
          toggleTheme={toggleTheme}
          themeMode={themeMode}
          activeMode={activeMode}
        />
      )}
    </ThemeProvider>
  );
};

