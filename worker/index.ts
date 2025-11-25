import { Hono } from 'hono';
import { verifyFirebaseAuth, getFirebaseToken } from '@hono/firebase-auth';
import type { VerifyFirebaseAuthConfig, VerifyFirebaseAuthEnv } from '@hono/firebase-auth';
import type { AppVersion, ApiResponse } from './db-types';
import userRoutes from './routes/users';
import taskRoutes from './routes/tasks';
import tagRoutes from './routes/tags';

const config: VerifyFirebaseAuthConfig = {
  projectId: 'planer-4ea92',
};

type Bindings = Env & VerifyFirebaseAuthEnv;

const app = new Hono<{ Bindings: Bindings }>();

// Health check endpoint (public, no auth required)
app.get('/api/health', async (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Apply Firebase Auth middleware to all /api/* routes except health check
app.use('/api/*', verifyFirebaseAuth(config));

// Middleware to check email verification for all protected routes
app.use('/api/*', async (c, next) => {
  // Skip verification check for certain endpoints
  const path = new URL(c.req.url).pathname;
  if (path === '/api/health' || path === '/api/auth/me' || path.startsWith('/api/users/sync')) {
    return next();
  }
  
  const idToken = getFirebaseToken(c);
  if (idToken && !idToken.email_verified) {
    return c.json({
      success: false,
      error: 'Email not verified. Please verify your email to access this resource.',
      requiresEmailVerification: true,
    }, 403);
  }
  
  return next();
});

// Mount routes
app.route('/api/users', userRoutes);
app.route('/api/tasks', taskRoutes);
app.route('/api/tags', tagRoutes);

// Get current user info (protected)
app.get('/api/auth/me', async (c) => {
  const idToken = getFirebaseToken(c);
  
  if (!idToken) {
    return c.json({
      success: false,
      error: 'Unauthorized',
    }, 401);
  }
  
  // Check if email is verified
  if (!idToken.email_verified) {
    return c.json({
      success: false,
      error: 'Email not verified. Please verify your email to access this resource.',
      requiresEmailVerification: true,
    }, 403);
  }
  
  return c.json({
    success: true,
    data: {
      uid: idToken.uid,
      email: idToken.email,
      email_verified: idToken.email_verified,
    },
  });
});

// Get current app version (protected)
app.get('/api/version', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT * FROM app_version WHERE is_current = 1 ORDER BY created_at DESC LIMIT 1"
    ).first<AppVersion>();
    
    const response: ApiResponse<AppVersion | null> = {
      success: true,
      data: result || null,
    };
    return c.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
    return c.json(response, 500);
  }
});

// Get all versions (protected)
app.get('/api/versions', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM app_version ORDER BY created_at DESC"
    ).all<AppVersion>();
    
    const response: ApiResponse<AppVersion[]> = {
      success: true,
      data: results,
    };
    return c.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
    return c.json(response, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler for authentication errors
app.onError((err, c) => {
  console.error('Error:', err);
  
  if (err.message.includes('Unauthorized') || err.message.includes('authentication')) {
    return c.json({ 
      success: false, 
      error: 'Unauthorized. Please login.' 
    }, 401);
  }
  
  return c.json({ 
    success: false, 
    error: 'Internal server error' 
  }, 500);
});

export default app;
