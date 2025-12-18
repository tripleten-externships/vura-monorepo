import React from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { client } from './store';
import { StoreProvider } from './store/StoreContext';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './navigation/AppRoutes';

export default function App() {
  return (
    <ApolloProvider client={client}>
      <StoreProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </StoreProvider>
    </ApolloProvider>
  );
}
