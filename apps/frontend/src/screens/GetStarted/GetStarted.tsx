import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { InputField } from '../../components/InputField/InputField';
import { useNavigation } from '../../hooks/useNavigation';
import { useAuth } from '../../hooks/useAuth';

export default function GetStartedPage() {
  const navigation = useNavigation();
  const { login, signup, beginGoogleAuth, beginAppleAuth, loading, currentUser, error } = useAuth({
    onLoginSuccess: () => {
      Alert.alert('Success', 'Login successful');
      navigation.push('/');
    },
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleLogin = async () => {
    try {
      setHasAttempted(true);
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await signup({ email, password, name: fullName });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to authenticate. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const url = await beginGoogleAuth();
      if (url) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Google Sign-In', 'Unable to start Google sign-in. Please try again.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Google Sign-In', 'Unable to start Google sign-in. Please try again.');
    }
  };

  const handleAppleLogin = async () => {
    try {
      const url = await beginAppleAuth();
      Alert.alert(
        'Apple Sign-In',
        `Apple authentication for native clients should POST credentials to:\n${url}`
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Apple Sign-In', 'Unable to retrieve Apple auth instructions.');
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
      <Text style={styles.subtitle}>
        {mode === 'login' ? 'Please log in to continue' : 'Create an account to get started'}
      </Text>

      {hasAttempted && error ? <Text style={styles.errorText}>{error.message}</Text> : null}

      {mode === 'signup' ? (
        <InputField
          placeholder="Full name"
          placeholderTextColor="rgba(54,54,54,0.5)"
          value={fullName}
          onChange={setFullName}
          containerStyle={styles.inputContainer}
        />
      ) : null}

      <InputField
        placeholder="Email"
        placeholderTextColor="rgba(54,54,54,0.5)"
        value={email}
        onChange={setEmail}
        containerStyle={styles.inputContainer}
      />
      <InputField
        placeholder="Password"
        placeholderTextColor="rgba(54,54,54,0.5)"
        value={password}
        onChange={setPassword}
        secureTextEntry
        containerStyle={styles.inputContainer}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => {
          handleLogin();
        }}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? mode === 'login'
              ? 'Logging in...'
              : 'Creating account...'
            : mode === 'login'
              ? 'Login'
              : 'Sign up'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setMode(mode === 'login' ? 'signup' : 'login');
          setHasAttempted(false);
        }}
        style={styles.modeToggle}
      >
        <Text style={styles.modeToggleText}>
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerLabel}>or continue with</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
        <Text style={styles.socialButtonText}>Continue with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.socialButton} onPress={handleAppleLogin}>
        <Text style={styles.socialButtonText}>Continue with Apple</Text>
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
  inputContainer: {
    borderColor: '#e7e7e7',
    paddingHorizontal: 20,
    marginTop: 20,
    width: 345,
    backgroundColor: '#f6f4fa',
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
  modeToggle: {
    marginTop: 16,
  },
  modeToggleText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    width: 345,
    gap: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#d6d6d6',
  },
  dividerLabel: {
    color: '#666',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  socialButton: {
    marginTop: 12,
    width: 345,
    backgroundColor: '#ffffff',
    borderColor: '#e7e7e7',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  socialButtonText: {
    color: '#333333',
    fontWeight: '600',
  },
});
