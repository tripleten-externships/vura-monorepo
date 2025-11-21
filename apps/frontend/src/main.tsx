import { ApolloProvider } from '@apollo/client/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { client } from './store';
import { StoreProvider } from './store/StoreContext';
import { AppNavigator } from './navigation/AppNavigator.web';
import './global/default.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <StoreProvider>
        <AppNavigator />
      </StoreProvider>
    </ApolloProvider>
  </React.StrictMode>
);
