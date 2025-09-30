import { ApolloClient } from '@apollo/client';
import { makeAutoObservable } from 'mobx';
import { client } from './apolloClient';
import { UIStore } from './uiStore';

/**
 * Root store that manages all MobX stores and provides access to Apollo Client
 * This serves as the main orchestrator for client-side state management
 */
export class RootStore {
  // Apollo Client instance for GraphQL operations
  public apolloClient: any;

  // Individual stores
  public uiStore: UIStore;

  constructor(apolloClient = client) {
    this.apolloClient = apolloClient;

    // Initialize stores directly
    this.uiStore = new UIStore(this);

    makeAutoObservable(this, {
      apolloClient: false, // Don't make Apollo Client observable
    });
  }

  /**
   * Reset all stores to their initial state
   * Useful for logout or when switching users
   */
  reset() {
    if (this.uiStore) {
      this.uiStore.reset();
    }
    // Clear Apollo Client cache
    this.apolloClient.clearStore();
  }

  /**
   * Utility method to access Apollo Client from any store
   */
  get client() {
    return this.apolloClient;
  }
}

// Create singleton instance - UIStore will be initialized when imported
export const rootStore = new RootStore();
