import React, { createContext, useContext, ReactNode } from 'react';
import { RootStore, rootStore } from './rootStore';

// Create React Context for the store
const StoreContext = createContext<RootStore | null>(null);

// Provider component props
interface StoreProviderProps {
  children: ReactNode;
  store?: RootStore; // Optional store prop for testing or custom instances
}

/**
 * Store Provider component that provides the MobX store to the React tree
 * This should wrap app at the root level
 */
export const StoreProvider: React.FC<StoreProviderProps> = ({ children, store = rootStore }) => {
  // Initialize store with persisted data on mount
  React.useEffect(() => {
    store.uiStore.initializeFromStorage();
  }, [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

/**
 * Hook to access the root store
 * Throws an error if used outside of StoreProvider
 */
export const useStore = (): RootStore => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return store;
};

/**
 * Hook to access the UI store directly
 * Convenience hook for the most commonly used store
 */
export const useUIStore = () => {
  const store = useStore();
  return store.uiStore;
};

export const useResourceStore = () => useStore().resourceStore;
export const useForumStore = () => useStore().forumStore;
export const useNotificationStore = () => useStore().notificationStore;
export const useAiStore = () => useStore().aiStore;

/**
 * Hook to access the Apollo Client from the store
 * Useful when weneed direct access to Apollo Client methods
 */
export const useApolloClient = () => {
  const store = useStore();
  return store.apolloClient;
};

/**
 * Higher-order component that injects stores as props
 * Alternative to hooks for class components
 */
export const withStores = <P extends object>(
  Component: React.ComponentType<P & { stores: RootStore }>
) => {
  return (props: P) => {
    const stores = useStore();
    return <Component {...props} stores={stores} />;
  };
};
