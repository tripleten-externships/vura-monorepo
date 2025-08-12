import { ApolloProvider } from '@apollo/client/react';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { client } from '../src/store';
import '../src/global/default.css';

export default function RootLayout() {
  useEffect(() => {
    // initialize any app-wide setup here
  }, []);

  return (
    <ApolloProvider client={client}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="welcome" options={{ title: 'Welcome' }} />
      </Stack>
    </ApolloProvider>
  );
}
