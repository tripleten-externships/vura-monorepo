// src/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apolloClient } from '../apollo/client';
import { getToken, saveToken, deleteToken } from '../store/secureStore';

type User = { id: string; email: string; name?: string | null } | null;

type AuthContextType = {
  user: User;
  token: string | null;
  loading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for consuming auth context safely
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// AuthProvider wraps the app and manages authentication state
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to restore a previous session on app startup
    (async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (e) {
        console.warn('Failed to restore auth token', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (newToken: string, newUser: User) => {
    await saveToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const signOut = async () => {
    await deleteToken();
    try {
      await apolloClient.clearStore();
    } catch (e) {
      // ignore
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
