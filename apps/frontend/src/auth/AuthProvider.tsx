// src/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apolloClient } from '../apollo/client';
import { CURRENT_USER_QUERY } from '../graphql/mutations/mutations';
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
          try {
            const result = await apolloClient.query({
              query: CURRENT_USER_QUERY,
              fetchPolicy: 'network-only',
              context: {
                headers: {
                  authorization: `Bearer ${storedToken}`,
                },
              },
            });

            // Extract the current user from the API response
            const me = (result.data as any)?.me;
            setUser(me ?? null);
            setToken(storedToken);
          } catch (err) {
            // Invalid or expired token, clear it
            await deleteToken();
            setUser(null);
            setToken(null);
          }
        }
      } catch (e) {
        // Reading token failed, treat as logged out
        console.warn('Restore token failed', e);
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
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
