import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import HomeScreen from '../screens/Home/Home';
import LoginScreen from '../screens/Login/Login';
import ChecklistScreen from '../screens/Checklist/Checklist';
import ResourcesScreen from '../screens/Resources/Resources';
import CommunityForumsScreen from '../screens/CommunityForums/CommunityForums';
import ProfileScreen from '../screens/Profile/Profile';
import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import OnboardingChat from '../screens/Onboarding/OnboardingChat';
import NotificationsScreen from '../screens/Notifications/Notifications';
import DeleteAccount from '../screens/DeleteAccout/DeleteAccount';
import { View, StyleSheet, Platform } from 'react-native';
import { BottomNavBar } from '../components/BottomNavBar';

const NavLayout = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.shell}>
    {children}
    <BottomNavBar />
  </View>
);

export function AppRoutes() {
  const { currentUser } = useAuth({});
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      {/* Public entry points */}
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/onboarding" element={<WelcomeScreen />} />
      <Route path="/onboarding/chat" element={<OnboardingChat />} />
      <Route
        path="/care-plan"
        element={
          <NavLayout>
            <ChecklistScreen />
          </NavLayout>
        }
      />

      {/* Authenticated app */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <NavLayout>
              <HomeScreen />
            </NavLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklist"
        element={
          <ProtectedRoute>
            <NavLayout>
              <ChecklistScreen />
            </NavLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <NavLayout>
              <ResourcesScreen />
            </NavLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <NavLayout>
              <CommunityForumsScreen />
            </NavLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <NavLayout>
              <ProfileScreen />
            </NavLayout>
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

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? '100%' : undefined,
    backgroundColor: '#fff',
  },
});
