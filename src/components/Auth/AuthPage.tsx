import { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import { ForgotPassword } from './ForgotPassword';

type AuthMode = 'login' | 'register' | 'forgot-password';

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const handleForgotPassword = () => {
    setMode('forgot-password');
  };

  const handleBackToLogin = () => {
    setMode('login');
  };

  if (mode === 'forgot-password') {
    return <ForgotPassword onBackToLogin={handleBackToLogin} />;
  }

  return mode === 'login' ? (
    <Login onToggleMode={handleToggleMode} onForgotPassword={handleForgotPassword} />
  ) : (
    <Register onToggleMode={handleToggleMode} />
  );
};

