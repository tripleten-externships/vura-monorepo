import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { NavigationHistoryProvider } from './NavigationHistoryProvider';
import '../global/default.css';

export function AppNavigator() {
  return (
    <BrowserRouter>
      <NavigationHistoryProvider>
        <NavigatorContent />
      </NavigationHistoryProvider>
    </BrowserRouter>
  );
}

const NavigatorContent = () => {
  return (
    <div className="app-shell">
      <main className="app-shell__content">
        <AppRoutes />
      </main>
    </div>
  );
};
