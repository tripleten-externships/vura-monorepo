import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// import { router } from 'expo-router';
import { Bell } from '../src/components/NotificationBell/NotificationBell';
import { Emoji } from '../src/components/Emoji/Emoji';
import { PostInput } from '../src/components/PostInput/PostInput';
import { InputField } from '../src/components/InputField/InputField';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_TOKEN } from '../src/store/apolloClient';
import { WebSocketTest } from '../src/components/WebSocketTest';
import { USER_LOGIN } from '../src/graphql/mutations';
import { useMutation } from '@apollo/client/react';

export default function WelcomePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [login, { loading }] = useMutation(USER_LOGIN);

  // debug effect to monitor isLoggedIn state
  useEffect(() => {
    console.log('isLoggedIn state changed: ', isLoggedIn);
  }, [isLoggedIn]);

  const handleLogin = async () => {
    try {
      console.log('Attempting login with: ', { email, password });

      const { data } = await login({
        variables: { email, password },
      });

      console.log('Login response: ', data);

      if (!data) {
        console.error('No data returned');
        Alert.alert('Error', 'Authentication failed');
        return;
      }

      const auth = data.authenticateUserWithPassword;
      console.log('Auth data: ', auth);

      if (!auth) {
        console.error('No auth data returned');
        Alert.alert('Error', 'Authentication failed');
        return;
      }

      // check the __typename to determine success or failure
      if (auth.__typename === 'UserAuthenticationWithPasswordSuccess') {
        console.log('Login successful: ', auth.item);
        // store the token
        await AsyncStorage.setItem(AUTH_TOKEN, auth.sessionToken);
        console.log('Token stored in AsyncStorage: ', auth.sessionToken);
        setIsLoggedIn(true);
        Alert.alert('Success', `Logged in as ${auth.item.name || auth.item.email}`);
      } else if (auth.__typename === 'UserAuthenticationWithPasswordFailure') {
        console.error('Login failed: ', auth.message);
        Alert.alert('Login Failed', auth.message);
      } else {
        console.error('Unknown auth response format: ', auth);
        Alert.alert('Error', 'Unknown authentication response format');
      }
    } catch (error) {
      console.error('Login error: ', error);
      Alert.alert('Error', 'Failed to login. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Vura by Betterhunt</Text>
      <Text style={styles.subtitle}>Please log in to continue</Text>

      {/* Debug info */}
      <Text style={{ color: isLoggedIn ? 'green' : 'red', fontWeight: 'bold', marginBottom: 10 }}>
        Login Status: {isLoggedIn ? 'Logged In' : 'Not Logged In'}
      </Text>

      {/* Login form */}
      <InputField
        placeholder="Email"
        placeholderTextColor="rgba(54,54,54,0.5)"
        value={email}
        onChange={setEmail}
        containerStyle={{
          borderColor: '#e7e7e7',
          paddingHorizontal: 20,
          marginTop: 20,
          width: 345,
          backgroundColor: '#f6f4fa',
        }}
      />
      <InputField
        placeholder="Password"
        placeholderTextColor="rgba(54,54,54,0.5)"
        value={password}
        onChange={setPassword}
        secureTextEntry
        containerStyle={{
          borderColor: '#e7e7e7',
          paddingHorizontal: 20,
          marginTop: 20,
          width: 345,
          backgroundColor: '#f6f4fa',
        }}
      />
      <InputField
        placeholderTextColor="rgba(54,54,54,0.5)"
        placeholder="Ask AI helper, any question"
        svgIcon={{ uri: '../../assets/arrow_right.png' }}
        containerStyle={{
          borderColor: '#e7e7e7',
          height: 62,
          paddingHorizontal: 16,
          marginTop: 20,
          width: 345,
          backgroundColor: '#ffffff',
        }}
        iconStyle={{ width: 32, height: 32, marginTop: -4 }}
      />
      <InputField
        placeholderTextColor="rgba(54,54,54,0.5)"
        placeholder="Type your answer"
        svgIcon={{ uri: '../../assets/Send.png' }}
        containerStyle={{
          borderColor: '#e7e7e7',
          height: 62,
          paddingHorizontal: 16,
          marginTop: 20,
          width: 345,
          backgroundColor: '#ffffff',
        }}
        iconStyle={{ width: 24, height: 24 }}
      />
      {/* I added a post input field to test the component. */}
      <PostInput
        placeholderTextColor="rgba(54,54,54,0.5)"
        titlePlaceholder="Post title"
        bodyPlaceholder="Post text"
      />
      {/* test emoji component */}
      <Emoji emojiIcon={{ uri: '../../assets/smile.svg' }} />
      {/* test bell component  */}
      <Bell bellIcon={{ uri: '../../assets/notification_bell.png' }} />
      {/* Always show login button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => {
          console.log('Login button pressed');
          handleLogin();
        }}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : isLoggedIn ? 'Refresh Login' : 'Login'}
        </Text>
      </TouchableOpacity>

      {/* Separate section for WebSocketTest */}
      {isLoggedIn && (
        <View style={styles.loggedInContainer}>
          <Text style={styles.successText}>You're logged in! WebSocket test below:</Text>
          <View style={styles.websocketContainer}>
            {/* <WSTestScreen /> */}
            <WebSocketTest />
            {/* <Text>[Jonah - 20251020] WebSocket test disabled for now</Text> */}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loggedInContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  websocketContainer: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    backgroundColor: '#ffffff',
  },
  successText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
