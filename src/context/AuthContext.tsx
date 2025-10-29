"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, setPersistence, browserLocalPersistence } from 'firebase/auth';

// Define the shape of the authentication context
interface AuthContextType {
  user: FirebaseUser | null;
  userUid: string | null;
  isAuthenticated: boolean;
  authLoading: boolean;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap the application
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Set persistence to local storage
        await setPersistence(auth, browserLocalPersistence);

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser && !firebaseUser.isAnonymous) {
            setUser(firebaseUser);
            setUserUid(firebaseUser.uid);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setUserUid(null);
            setIsAuthenticated(false);
          }
          setAuthLoading(false);
        });
        return () => unsubscribe(); // Clean up the listener
      } catch (error) {
        console.error("Error setting Firebase persistence:", error);
        setAuthLoading(false);
        // Handle error, e.g., show a message to the user
      }
    };

    setupAuth();
  }, []);

  const contextValue = {
    user,
    userUid,
    isAuthenticated,
    authLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};