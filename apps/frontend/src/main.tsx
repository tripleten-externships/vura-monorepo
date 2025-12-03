import { ApolloProvider } from '@apollo/client/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { observer } from 'mobx-react-lite';
import { client } from './store';
import { StoreProvider } from './store/StoreContext';
import { AppNavigator } from './navigation/AppNavigator.web';

import './global/default.css';

const AppContent = observer(() => {
  return (
    <>
      <AppNavigator />
    </>
  );
});

const Main = () => (
  <React.StrictMode>
    <ApolloProvider client={client}>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </ApolloProvider>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')!).render(<Main />);
