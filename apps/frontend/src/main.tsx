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
  // Temporarily disabled StrictMode to prevent development-only DOM errors
  // <React.StrictMode>
  <ApolloProvider client={client}>
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  </ApolloProvider>
  // </React.StrictMode>
);

// Root management with Vite HMR support
function initializeApp() {
  const rootElement = document.getElementById('root')!;

  // Clear any existing content to prevent conflicts
  rootElement.innerHTML = '';

  // Create fresh root every time during HMR
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Main />);

  return root;
}

// Initialize the app
const root = initializeApp();

// Handle Vite HMR (Hot Module Replacement)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Cleanup on hot reload
    try {
      root.unmount();
    } catch (e) {
      // Ignore cleanup errors
      console.warn('Error during HMR cleanup:', e);
    }
  });
}
