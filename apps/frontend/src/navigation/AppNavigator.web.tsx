import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { NavigationHistoryProvider } from './NavigationHistoryProvider';
import '../global/default.css';
import { BottomNavBar } from '../components/BottomNavBar';
import ProtectedRoute from '../components/ProtectedRoute';

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
      <ProtectedRoute>
        <header className="app-shell__header"></header>
      </ProtectedRoute>
      <main className="app-shell__content">
        <AppRoutes />
      </main>
      <ProtectedRoute>
        <footer className="app-shell__footer">
          <BottomNavBar />
        </footer>
      </ProtectedRoute>
    </div>
  );
};
