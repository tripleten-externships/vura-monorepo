/**
 * Example usage of MobX stores with Apollo Client
 * This file demonstrates how to use the store setup in your components
 */

import React from 'react';
import { observer } from 'mobx-react-lite';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useStore, useUIStore } from './index';

// types for the GraphQL responses
interface User {
  id: string;
  name: string;
  email: string;
}

interface GetUsersData {
  users: User[];
}

// example GraphQL operations (you would import these from your actual queries)
const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
    }
  }
`;

/**
 * Example 1: Using Apollo Client hooks with MobX for loading states and notifications
 */
export const UserListWithApollo = observer(() => {
  const uiStore = useUIStore();

  const { data, loading, error } = useQuery<GetUsersData>(GET_USERS);
  const [createUser] = useMutation(CREATE_USER);

  // sync Apollo loading state with MobX
  React.useEffect(() => {
    uiStore.setLoading('users', loading);
  }, [loading, uiStore]);

  // handle Apollo errors with MobX notifications
  React.useEffect(() => {
    if (error) {
      uiStore.showError('Failed to load users', error.message);
    }
  }, [error, uiStore]);

  const handleCreateUser = async () => {
    try {
      uiStore.setLoading('createUser', true);
      const result = await createUser({
        variables: {
          input: { name: 'New User', email: 'user@example.com' },
        },
      });
      uiStore.showSuccess('User created successfully!');
    } catch (err) {
      uiStore.showError('Failed to create user', (err as Error).message);
    } finally {
      uiStore.setLoading('createUser', false);
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <h2>Users</h2>
      {data?.users?.map((user: any) => (
        <div key={user.id}>
          {user.name} - {user.email}
        </div>
      ))}
      <button onClick={handleCreateUser} disabled={uiStore.isLoading('createUser')}>
        {uiStore.isLoading('createUser') ? 'Creating...' : 'Create User'}
      </button>
    </div>
  );
});

/**
 * Example 2: Custom store that extends BaseStore for domain-specific logic
 */
import { makeAutoObservable } from 'mobx';
import { BaseStore } from './baseStore';
import type { RootStore } from './rootStore';

export class UserStore extends BaseStore {
  users: any[] = [];
  selectedUser: any = null;
  filter: string = '';

  constructor(rootStore: RootStore) {
    super(rootStore);
    makeAutoObservable(this);
  }

  // fetch users using BaseStore utility methods
  async fetchUsers() {
    this.rootStore.uiStore.setLoading('users', true);

    try {
      await this.executeQuery(
        GET_USERS,
        {},
        (data) => {
          this.users = data.users;
        },
        (error) => {
          this.rootStore.uiStore.showError('Failed to fetch users', error.message);
        }
      );
    } finally {
      this.rootStore.uiStore.setLoading('users', false);
    }
  }

  // create user with optimistic updates
  async createUser(userData: { name: string; email: string }) {
    const tempId = `temp-${Date.now()}`;
    const optimisticUser = { ...userData, id: tempId };

    // optimistic update
    this.users.push(optimisticUser);

    try {
      await this.executeMutation(
        CREATE_USER,
        { input: userData },
        (data) => {
          // replace optimistic user with real data
          const index = this.users.findIndex((u) => u.id === tempId);
          if (index !== -1) {
            this.users[index] = data.createUser;
          }
          this.rootStore.uiStore.showSuccess('User created successfully');
        },
        (error) => {
          // remove optimistic user on error
          this.users = this.users.filter((u) => u.id !== tempId);
          this.rootStore.uiStore.showError('Failed to create user', error.message);
        }
      );
    } catch (error) {
      // error handling is done in the onError callback
    }
  }

  setFilter(filter: string) {
    this.filter = filter;
  }

  get filteredUsers() {
    if (!this.filter) return this.users;
    return this.users.filter(
      (user) =>
        user.name.toLowerCase().includes(this.filter.toLowerCase()) ||
        user.email.toLowerCase().includes(this.filter.toLowerCase())
    );
  }

  selectUser(user: any) {
    this.selectedUser = user;
  }

  reset() {
    this.users = [];
    this.selectedUser = null;
    this.filter = '';
  }
}

/**
 * Example 3: Component using custom store
 */
export const UserManagement = observer(() => {
  const { uiStore } = useStore();
  // in a real app, we would add UserStore to RootStore and access it here
  // const userStore = useStore().userStore;

  return (
    <div>
      <h2>User Management</h2>

      {uiStore.isLoading('users') && <div>Loading...</div>}

      <div className="notifications">
        {uiStore.notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification ${notification.type}`}
            onClick={() => uiStore.removeNotification(notification.id)}
          >
            <strong>{notification.title}</strong>
            {notification.message && <p>{notification.message}</p>}
          </div>
        ))}
      </div>

      {uiStore.isModalOpen && (
        <div className="modal-overlay" onClick={() => uiStore.closeModal()}>
          <div className="modal-content">
            <h3>Modal Content</h3>
            <p>{uiStore.modalContent}</p>
            <button onClick={() => uiStore.closeModal()}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Example 4: App setup with StoreProvider
 */
export const AppExample = () => {
  return (
    // wrap app with StoreProvider to provide access to stores
    <div className="app">
      <UserListWithApollo />
      <UserManagement />
    </div>
  );
};
