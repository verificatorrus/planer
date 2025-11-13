import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDykfPrJepjquDkXGuk3rU34I29aFORa_Q",
  authDomain: "planer-4ea92.firebaseapp.com",
  projectId: "planer-4ea92",
  storageBucket: "planer-4ea92.firebasestorage.app",
  messagingSenderId: "23163939657",
  appId: "1:23163939657:web:bafdaf20d90244546d0898"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;

