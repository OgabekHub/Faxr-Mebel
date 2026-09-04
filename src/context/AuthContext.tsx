import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  /** Signed-in Firebase user, or null. */
  user: User | null;
  /** True until Firebase has reported the initial auth state. */
  loading: boolean;
  /** True when `admins/{uid}` exists for the signed-in user (see firestore.rules). */
  isAdmin: boolean;
  /** True while the admin flag is being fetched for the current user. */
  adminLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Single auth subscription for the whole app. Before this, Navbar, Cart,
 * Profile and ProtectedRoute each ran their own onAuthStateChanged listener,
 * and nothing ever read the admin allowlist.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) {
      setIsAdmin(false);
      setAdminLoading(false);
      return;
    }

    let cancelled = false; // ignore a stale response after the user changed
    setAdminLoading(true);
    getDoc(doc(db, 'admins', uid))
      .then((snapshot) => {
        if (!cancelled) setIsAdmin(snapshot.exists());
      })
      .catch((error: unknown) => {
        // Missing rule / offline: treat as non-admin rather than crashing.
        console.warn('Could not read admin flag:', error);
        if (!cancelled) setIsAdmin(false);
      })
      .finally(() => {
        if (!cancelled) setAdminLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const value = useMemo<AuthContextType>(
    () => ({ user, loading, isAdmin, adminLoading }),
    [user, loading, isAdmin, adminLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
