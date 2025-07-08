import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  browserPopupRedirectResolver,
  Auth,
  getAuth
} from 'firebase/auth';
import { auth, app } from '../config/firebase';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, Firestore, doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  isAdmin: boolean;
  isHotelOwner: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  signInWithGoogle: () => Promise<FirebaseUser>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isHotelOwner: false,
  signIn: async () => { },
  signUp: async () => { },
  signOut: async () => { },
  loading: true,
  signInWithGoogle: async () => { throw new Error('Not implemented'); },
  logOut: async () => { }
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHotelOwner, setIsHotelOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          // Get user token to check custom claims
          const idTokenResult = await user.getIdTokenResult();
          const isAdminClaim = idTokenResult.claims.admin === true;
          const isHotelOwnerClaim = idTokenResult.claims.hotelOwner === true;

          // Check if user document exists
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists) {
            // Create user document if it doesn't exist
            await setDoc(userDocRef, {
              email: user.email,
              isAdmin: isAdminClaim || false,
              isHotelOwner: isHotelOwnerClaim || false,
              createdAt: new Date(),
              lastSignIn: new Date()
            });
            setIsAdmin(isAdminClaim || false);
            setIsHotelOwner(isHotelOwnerClaim || false);
          } else {
            // Update lastSignIn only if document exists
            await updateDoc(userDocRef, {
              lastSignIn: new Date(),
              // Update document with latest claim values
              isAdmin: isAdminClaim || userDoc.data()?.isAdmin || false,
              isHotelOwner: isHotelOwnerClaim || userDoc.data()?.isHotelOwner || false
            });
            setIsAdmin(isAdminClaim || userDoc.data()?.isAdmin || false);
            setIsHotelOwner(isHotelOwnerClaim || userDoc.data()?.isHotelOwner || false);
          }

          console.log('User auth state:', {
            email: user.email,
            isAdmin: isAdminClaim || userDoc.data()?.isAdmin || false,
            isHotelOwner: isHotelOwnerClaim || userDoc.data()?.isHotelOwner || false
          });
        } catch (error) {
          console.error('Error handling user document:', error);
          setIsAdmin(false);
          setIsHotelOwner(false);
        }
      } else {
        setIsAdmin(false);
        setIsHotelOwner(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  const signInHandler = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOutHandler = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      setIsHotelOwner(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const signUpHandler = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        email: email,
        isAdmin: false,
        isHotelOwner: false,
        createdAt: new Date(),
        lastSignIn: new Date()
      });
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signInWithGoogleHandler = async (): Promise<FirebaseUser> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);

      // Create or update user document
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists) {
        await setDoc(userDocRef, {
          email: result.user.email,
          isAdmin: false,
          isHotelOwner: false,
          createdAt: new Date(),
          lastSignIn: new Date(),
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        });
      } else {
        await updateDoc(userDocRef, {
          lastSignIn: new Date(),
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        });
      }

      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logOutHandler = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      setIsHotelOwner(false);
      localStorage.removeItem('lastProvider');
      localStorage.setItem('isDisconnected', 'true');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isHotelOwner,
        signIn: signInHandler,
        signUp: signUpHandler,
        signOut: signOutHandler,
        loading,
        signInWithGoogle: signInWithGoogleHandler,
        logOut: logOutHandler
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

interface FirebaseContextType {
  db: Firestore;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseContextType>({ db, auth });

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

interface FirebaseProviderProps {
  children: ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  return (
    <FirebaseContext.Provider value={{ db, auth }}>
      {children}
    </FirebaseContext.Provider>
  );
} 