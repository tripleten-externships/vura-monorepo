import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type NavigationContextValue = {
  currentPath: string;
  previousPath: string | null;
  history: string[];
  goBack: (fallback?: string) => void;
};

const NavigationHistoryContext = createContext<NavigationContextValue | null>(null);

type NavigationHistoryProviderProps = {
  children: React.ReactNode;
};

export const NavigationHistoryProvider: React.FC<NavigationHistoryProviderProps> = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const historyRef = useRef<string[]>([]);

  const history = historyRef.current;
  const lastIndex = history.length - 1;
  const currentPath = lastIndex >= 0 ? history[lastIndex] : location.pathname;
  const previousPath = lastIndex > 0 ? history[lastIndex - 1] : null;

  if (history.length === 0 || history[lastIndex] !== location.pathname) {
    historyRef.current = [...history, location.pathname];
  }

  const goBack = useCallback(
    (fallback: string = '/') => {
      if (historyRef.current.length > 1) {
        navigate(-1);
      } else {
        navigate(fallback);
      }
    },
    [navigate]
  );

  const value = useMemo<NavigationContextValue>(
    () => ({
      currentPath,
      previousPath,
      history: historyRef.current,
      goBack,
    }),
    [currentPath, previousPath, goBack]
  );

  return (
    <NavigationHistoryContext.Provider value={value}>{children}</NavigationHistoryContext.Provider>
  );
};

export const useNavigationHistory = () => {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error('useNavigationHistory must be used within NavigationHistoryProvider');
  }
  return context;
};
