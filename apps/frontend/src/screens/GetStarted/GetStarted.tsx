import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
  Platform,
  ViewStyle,
} from 'react-native';
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

  const isSignup = mode === 'signup';

  const containerStyle = [
    styles.card,
    { maxWidth: '-webkit-fill-available' } as unknown as ViewStyle,
  ];
  return (
    <View style={containerStyle}>
      <View>
        <Text style={styles.heading}>{isSignup ? 'Sign Up' : 'Sign In'}</Text>
        {hasAttempted && error ? <Text style={styles.errorText}>{error.message}</Text> : null}
        {isSignup && (
          <InputField
            placeholder="Full name"
            placeholderTextColor="#A8A4B0"
            value={fullName}
            onChange={setFullName}
            containerStyle={styles.input}
          />
        )}

        <InputField
          placeholder="Email"
          placeholderTextColor="#A8A4B0"
          value={email}
          onChange={setEmail}
          containerStyle={styles.input}
        />
        <InputField
          placeholder="Password"
          placeholderTextColor="#A8A4B0"
          value={password}
          onChange={setPassword}
          secureTextEntry
          containerStyle={styles.input}
        />
        {isSignup && (
          <InputField
            placeholder="Repeat password"
            placeholderTextColor="#A8A4B0"
            value={password}
            onChange={setPassword}
            secureTextEntry
            containerStyle={styles.input}
          />
        )}
      </View>

      <View>
        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
          <Image
            source={{ uri: '../../../assets/google.png' }}
            style={{ width: 22, height: 22, marginRight: 8 }}
          />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} onPress={handleAppleLogin}>
          <Image
            source={{ uri: '../../../assets/apple.png' }}
            style={{ width: 20, height: 25, marginRight: 8 }}
          />
          <Text style={styles.socialButtonText}>Continue with Apple</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>{isSignup ? 'Sign up' : 'Sign in'}</Text>
        </TouchableOpacity>
        <View style={styles.switchContainer}>
          <TouchableOpacity
            onPress={() => {
              setMode(isSignup ? 'login' : 'signup');
              setHasAttempted(false);
            }}
          >
            <Text style={styles.switchText}>
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingVertical: 48,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 20,
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 32,
    fontWeight: '400',
    color: '#2C2C2E',
    textAlign: 'center',
    fontFamily: 'Noto Serif',
    marginBottom: 32,
  },
  errorText: {
    color: '#b00020',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F3EFF8',
    borderRadius: 16,
    borderColor: '#F3EFF8',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#1F1F22',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#8A8A8E',
  },
  socialButton: {
    flexDirection: 'row',
    width: '100%',
    borderColor: '#D8D8D8',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  socialButtonText: {
    color: '#1F1F22',
    fontWeight: '500',
  },
});
