import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import ProtectedRoute from '../components/ProtectedRoute';
import HomeScreen from '../screens/Home/Home';
import GetStartedScreen from '../screens/GetStarted/GetStarted';
import ChecklistScreen from '../screens/Checklist/Checklist';
import ResourcesScreen from '../screens/Resources/Resources';
import CommunityForumsScreen from '../screens/CommunityForums/CommunityForums';
import ProfileScreen from '../screens/Profile/Profile';
import NotificationsScreen from '../screens/Notifications/Notifications';
import QuestionnaireDemo from '../screens/QuestionnaireDemo';
import StandaloneQuestionnaireDemo from '../screens/StandaloneQuestionnaireDemo';
import ComponentDemos from '../screens/ComponentDemos';
import EnhancedQuestionnaireDemo from '../screens/EnhancedQuestionnaireDemo';
import MobileQuestionnaireDemo from '../screens/MobileQuestionnaireDemo';
import NavigationHelper from '../screens/NavigationHelper';

export function AppRoutes() {
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
      <Route path="/questionnaire-demo" element={<QuestionnaireDemo />} />
      <Route path="/standalone-demo" element={<StandaloneQuestionnaireDemo />} />
      <Route path="/component-demos" element={<ComponentDemos />} />
      <Route path="/enhanced-demo" element={<EnhancedQuestionnaireDemo />} />
      <Route path="/mobile-demo" element={<MobileQuestionnaireDemo />} />
      <Route path="/nav-helper" element={<NavigationHelper />} />
      <Route path="/navigation-helper" element={<NavigationHelper />} />
      <Route path="*" element={<Navigate to="/enhanced-demo" replace />} />
    </Routes>
  );
}
