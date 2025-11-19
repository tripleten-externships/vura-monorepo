import React from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { client } from './store';
import { StoreProvider } from './store/StoreContext';
import { AppNavigator } from './navigation/AppNavigator.native';

export default function App() {
  return (
    <ApolloProvider client={client}>
      <StoreProvider>
        <AppNavigator />
      </StoreProvider>
    </ApolloProvider>
  );
}
