import { ApolloClient, DocumentNode, TypedDocumentNode } from '@apollo/client';
import { makeAutoObservable, runInAction } from 'mobx';
import type { RootStore } from './rootStore';

/**
 * Base store class that provides common utilities for Apollo Client integration
 * All other stores should extend this class to get Apollo Client access and utilities
 */
export abstract class BaseStore {
  protected rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    // Note: makeAutoObservable should only be called in the leaf class (e.g. UIStore)
    // not in the base class when using inheritance
  }

  /**
   * Get Apollo Client instance
   */
  protected get apolloClient() {
    return this.rootStore.apolloClient;
  }

  /**
   * Execute a GraphQL query and optionally update store state with the result
   * @param query - GraphQL query to execute
   * @param variables - Variables for the query
   * @param onSuccess - Callback to handle successful query result
   * @param onError - Callback to handle query errors
   */
  protected async executeQuery<TData = any, TVariables = any>(
    query: DocumentNode | TypedDocumentNode<TData, TVariables>,
    variables?: TVariables,
    onSuccess?: (data: TData) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const result = await this.apolloClient.query({
        query,
        variables,
        fetchPolicy: 'cache-first', // Use cache when possible
      });

      if (result.data && onSuccess) {
        runInAction(() => {
          onSuccess(result.data);
        });
      }

      return result;
    } catch (error) {
      if (onError) {
        runInAction(() => {
          onError(error as Error);
        });
      }
      throw error;
    }
  }

  /**
   * Execute a GraphQL mutation and optionally update store state with the result
   * @param mutation - GraphQL mutation to execute
   * @param variables - Variables for the mutation
   * @param onSuccess - Callback to handle successful mutation result
   * @param onError - Callback to handle mutation errors
   */
  protected async executeMutation<TData = any, TVariables = any>(
    mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
    variables?: TVariables,
    onSuccess?: (data: TData) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const result = await this.apolloClient.mutate({
        mutation,
        variables,
      });

      if (result.data && onSuccess) {
        runInAction(() => {
          onSuccess(result.data);
        });
      }

      return result;
    } catch (error) {
      if (onError) {
        runInAction(() => {
          onError(error as Error);
        });
      }
      throw error;
    }
  }

  /**
   * Watch a GraphQL query and automatically update store state when data changes
   * Returns an observable query that can be used to refetch or update variables
   */
  protected watchQuery<TData = any, TVariables = any>(
    query: DocumentNode | TypedDocumentNode<TData, TVariables>,
    variables?: TVariables,
    onUpdate?: (data: TData) => void,
    onError?: (error: Error) => void
  ) {
    const observable = this.apolloClient.watchQuery({
      query,
      variables,
      fetchPolicy: 'cache-and-network',
    });

    const subscription = observable.subscribe({
      next: (result: { data: TData }) => {
        if (result.data && onUpdate) {
          runInAction(() => {
            onUpdate(result.data);
          });
        }
      },
      error: (error: Error) => {
        if (onError) {
          runInAction(() => {
            onError(error);
          });
        }
      },
    });

    return { observable, subscription };
  }

  /**
   * Reset store to initial state - to be implemented by each store
   */
  abstract reset(): void;
}
