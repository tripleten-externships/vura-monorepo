import React from 'react';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from './AppRoutes';

export function AppNavigator() {
  return (
    <MemoryRouter>
      <AppRoutes />
    </MemoryRouter>
  );
}
