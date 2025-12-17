import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ComponentDemos from './screens/ComponentDemos';
import StandaloneQuestionnaireDemo from './screens/StandaloneQuestionnaireDemo';
import NavigationHelper from './screens/NavigationHelper';
import { StoreProvider } from './store/StoreContext';
import './global/default.css';

/**
 * EMERGENCY BYPASS - Direct demo access without any authentication
 *
 * This completely bypasses the main app routing and authentication system
 * Use this if the main app keeps redirecting to sign-in
 */

const DirectDemoApp = () => {
  return (
    <BrowserRouter>
      <StoreProvider>
        <Routes>
          <Route path="/direct-component-demos" element={<ComponentDemos />} />
          <Route path="/direct-standalone-demo" element={<StandaloneQuestionnaireDemo />} />
          <Route path="/direct-nav-helper" element={<NavigationHelper />} />
          <Route path="*" element={<NavigationHelper />} />
        </Routes>
      </StoreProvider>
    </BrowserRouter>
  );
};

// Only use this if you need to completely bypass the main app
export default DirectDemoApp;
