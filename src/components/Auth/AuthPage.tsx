import { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => setIsLogin(!isLogin);

  return isLogin ? (
    <Login onToggleMode={toggleMode} />
  ) : (
    <Register onToggleMode={toggleMode} />
  );
};

