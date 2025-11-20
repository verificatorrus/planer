import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { resendVerificationEmail } from '../../services/authService';

interface LoginProps {
  onToggleMode: () => void;
  onForgotPassword: () => void;
}

export const Login = ({ onToggleMode, onForgotPassword }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setNeedsVerification(false);
    setLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Failed to login');
        if (result.requiresEmailVerification) {
          setNeedsVerification(true);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setResendingEmail(true);
    setError('');
    setSuccess('');

    try {
      const result = await resendVerificationEmail(email, password);
      if (result.success) {
        setSuccess(result.message || 'Verification email sent!');
      } else {
        setError(result.error || 'Failed to send verification email');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', m: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Sign In
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Welcome back! Please login to your account.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {needsVerification && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Your email is not verified yet.
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={handleResendVerification}
                disabled={resendingEmail}
              >
                {resendingEmail ? <CircularProgress size={20} /> : 'Resend Verification Email'}
              </Button>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link
              component="button"
              variant="body2"
              onClick={onForgotPassword}
              sx={{ cursor: 'pointer', mb: 2, display: 'block' }}
            >
              Forgot Password?
            </Link>
            
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={onToggleMode}
                sx={{ cursor: 'pointer' }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

