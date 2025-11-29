import React from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { client } from './store';
import { StoreProvider } from './store/StoreContext';
import { AppNavigator } from './navigation/AppNavigator.native';

const AppContent = () => {
  return <AppNavigator />;
};

export default function App() {
  return (
    <ApolloProvider client={client}>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </ApolloProvider>
  );
}
