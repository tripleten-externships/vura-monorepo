import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import HomeScreen from '../screens/Home/Home';
import GetStartedScreen from '../screens/GetStarted/GetStarted';
import ChecklistScreen from '../screens/Checklist/Checklist';
import ResourcesScreen from '../screens/Resources/Resources';
import CommunityForumsScreen from '../screens/CommunityForums/CommunityForums';
import ProfileScreen from '../screens/Profile/Profile';
import NotificationsScreen from '../screens/Notifications/Notifications';
import DeleteAccount from '../screens/DeleteAccout/DeleteAccount';

export function AppRoutes() {
  const { currentUser } = useAuth({});
  return (
    <Routes>
      <Route path="/get-started" element={<GetStartedScreen />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklist"
        element={
          <ProtectedRoute>
            <ChecklistScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <ResourcesScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <CommunityForumsScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/delete-account"
        element={
          <ProtectedRoute>
            <DeleteAccount currentEmail={currentUser?.email ?? undefined} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
