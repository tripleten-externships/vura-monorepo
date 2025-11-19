import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';

export function AppNavigator() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
