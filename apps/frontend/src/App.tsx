import React from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { client } from './store';
import { StoreProvider } from './store/StoreContext';
import { AppNavigator } from './navigation/AppNavigator.native';
import { LoginForm } from './components/LoginForm';
import WelcomeScreen from './screens/Onboarding/WelcomeScreen';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <ApolloProvider client={client}>
      <StoreProvider>
        <AppNavigator />
      </StoreProvider>
    </ApolloProvider>
  );
}

// export default function App() {
//   return (
//     <ApolloProvider client={client}>
//       <StoreProvider>
//         <BrowserRouter>
//           <Routes>
//             <Route path="/" element={<WelcomeScreen />} />
//             <Route path="/login" element={<LoginForm />} />
//             <Route path="/app/*" element={<AppNavigator />} />
//           </Routes>
//         </BrowserRouter>
//       </StoreProvider>
//     </ApolloProvider>
//   )
// }
