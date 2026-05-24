'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { api } from '@/lib/api';
import type { User } from '@scentresort/shared';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUserProfile(register = false) {
    try {
      const res = register
        ? await api.post<{ user: User }>('/auth/register')
        : await api.get<{ user: User }>('/auth/me');
      setUser(res.user);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setLoading(true);
        await fetchUserProfile(true);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  }

  async function signUp(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    await sendEmailVerification(result.user);
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(getFirebaseAuth(), provider);
  }

  async function signOut() {
    await firebaseSignOut(getFirebaseAuth());
    setUser(null);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  }

  async function refreshUser() {
    if (firebaseUser) {
      await fetchUserProfile();
    }
  }

  async function resendVerificationEmail() {
    if (firebaseUser && !firebaseUser.emailVerified) {
      await sendEmailVerification(firebaseUser);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        refreshUser,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
