import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBJ9Rc0ePvUq4yUcZfcMXvp2LXrvUDzXho",
  authDomain: "travelgo-fyp.firebaseapp.com",
  projectId: "travelgo-fyp",
  storageBucket: "travelgo-fyp.appspot.com",
  messagingSenderId: "111010047752",
  appId: "1:111010047752:web:586dc4fded4344cf03eebd",
  measurementId: "G-YJJ8QK8RV1"
};

// Validate required config
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  throw new Error(`Missing required Firebase configuration keys: ${missingKeys.join(', ')}`);
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Get Firestore instance
export const db = getFirestore(app);

// Get Auth instance
export const auth = getAuth(app);

// Initialize Analytics only in browser environment
if (typeof window !== 'undefined') {
  getAnalytics(app);
} 