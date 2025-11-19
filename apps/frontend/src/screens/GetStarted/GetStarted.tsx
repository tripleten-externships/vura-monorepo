import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { InputField } from '../../components/InputField/InputField';
import { useNavigation } from '../../hooks/useNavigation';
import { useAuth } from '../../hooks/useAuth';

export default function GetStartedPage() {
  const navigation = useNavigation();
  const { login, loading, currentUser, error } = useAuth({
    onLoginSuccess: () => {
      Alert.alert('Success', 'Login successful');
      navigation.push('/');
    },
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);

  const handleLogin = async () => {
    try {
      setHasAttempted(true);
      await login({ email, password });
    } catch (error) {
      Alert.alert('Error', 'Failed to login. Please try again.');
    }
  };

  useEffect(() => {
    if (currentUser) {
      navigation.push('/');
    }
  }, [currentUser, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Vura by Betterhunt</Text>
      <Text style={styles.subtitle}>Please log in to continue</Text>

      {hasAttempted && error ? <Text style={styles.errorText}>{error.message}</Text> : null}

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
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => {
          handleLogin();
        }}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
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
  errorText: {
    color: '#b00020',
    marginTop: 8,
  },
});
