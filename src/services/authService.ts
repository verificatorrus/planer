import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../config/firebase';

const TOKEN_KEY = 'firebase_auth_token';

// Save token to localStorage
export const saveToken = async (user: User) => {
  const token = await user.getIdToken();
  localStorage.setItem(TOKEN_KEY, token);
  return token;
};

// Get token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// Sign up with email and password
export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send email verification
    await sendEmailVerification(userCredential.user);
    
    // Don't save token yet - user needs to verify email first
    return { 
      success: true, 
      user: userCredential.user,
      requiresEmailVerification: true,
      message: 'Verification email sent. Please check your inbox and verify your email before signing in.'
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sign up' 
    };
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if email is verified
    if (!userCredential.user.emailVerified) {
      // Sign out immediately if email not verified
      await firebaseSignOut(auth);
      return { 
        success: false, 
        error: 'Please verify your email before signing in. Check your inbox for the verification link.',
        requiresEmailVerification: true
      };
    }
    
    await saveToken(userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sign in' 
    };
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    removeToken();
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sign out' 
    };
  }
};

// Listen to auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user && user.emailVerified) {
      await saveToken(user);
      callback(user);
    } else {
      removeToken();
      callback(null);
    }
  });
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Refresh token
export const refreshToken = async () => {
  const user = getCurrentUser();
  if (user) {
    return await saveToken(user);
  }
  return null;
};

// Resend verification email
export const resendVerificationEmail = async (email: string, password: string) => {
  try {
    // Sign in to get the user object
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    if (userCredential.user.emailVerified) {
      await firebaseSignOut(auth);
      return { 
        success: false, 
        error: 'Email is already verified. You can sign in now.' 
      };
    }
    
    // Send verification email
    await sendEmailVerification(userCredential.user);
    
    // Sign out after sending email
    await firebaseSignOut(auth);
    
    return { 
      success: true, 
      message: 'Verification email sent. Please check your inbox.' 
    };
  } catch (error) {
    console.error('Resend verification email error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to resend verification email' 
    };
  }
};

