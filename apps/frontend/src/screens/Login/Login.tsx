import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
  ViewStyle,
} from 'react-native';
import { InputField } from '../../components/InputField/InputField';
import { useNavigation } from '../../hooks/useNavigation';
import { useAuth } from '../../hooks/useAuth';
import { colors, radii, spacing, typography } from '../../theme/designTokens';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LoginScreen() {
  const location = useLocation();
  const navigateRaw = useNavigate();
  const navigation = useNavigation();
  const { login, signup, beginGoogleAuth, beginAppleAuth, loading, currentUser, error } = useAuth({
    onLoginSuccess: () => {
      Alert.alert('Success', 'Login successful');
      const redirect = (location.state as any)?.from ?? '/';
      navigateRaw(redirect);
    },
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);
  const initialMode = useMemo(() => {
    const stateMode = (location.state as any)?.mode;
    const query = new URLSearchParams(location.search);
    const queryMode = query.get('mode');
    if (stateMode === 'signup' || queryMode === 'signup') return 'signup';
    return 'login';
  }, [location.search, location.state]);
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  const handleLogin = async () => {
    try {
      setHasAttempted(true);
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await signup({ email, password, name: fullName });
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lastEmail', email);
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
      const query = new URLSearchParams(location.search);
      const fromQuery = query.get('from');
      const redirect = (location.state as any)?.from ?? fromQuery ?? '/';
      navigation.push(redirect);
    }
  }, [currentUser, navigation, location.state, location.search]);

  const isSignup = mode === 'signup';

  const containerStyle = [
    styles.card,
    { maxWidth: '-webkit-fill-available' } as unknown as ViewStyle,
  ];
  return (
    <View style={styles.screen}>
      <View style={containerStyle}>
        <View>
          <Text style={styles.heading}>{isSignup ? 'Sign Up' : 'Sign In'}</Text>
          {hasAttempted &&
          error &&
          !/not authorized/i.test(error.message || '') &&
          !/logged in to view your profile/i.test(error.message || '') ? (
            <Text style={styles.errorText}>{error.message}</Text>
          ) : null}
          {isSignup && (
            <InputField
              placeholder="Full name"
              placeholderTextColor={colors.textSecondary}
              value={fullName}
              onChange={setFullName}
              containerStyle={styles.input}
              inputStyle={styles.inputText}
            />
          )}

          <InputField
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChange={setEmail}
            containerStyle={styles.input}
            inputStyle={styles.inputText}
          />
          <InputField
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChange={setPassword}
            secureTextEntry
            containerStyle={styles.input}
            inputStyle={styles.inputText}
          />
          {isSignup && (
            <InputField
              placeholder="Repeat password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChange={setPassword}
              secureTextEntry
              containerStyle={styles.input}
              inputStyle={styles.inputText}
            />
          )}
        </View>

        <View style={styles.actions}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.base,
    borderRadius: radii.cardLg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.xl,
    alignSelf: 'center',
    maxWidth: 480,
  },
  heading: {
    ...typography.headingSerif,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    marginBottom: spacing.sm,
    textAlign: 'center',
    ...typography.body16Regular,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    borderColor: colors.stroke,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    height: 62,
    justifyContent: 'center',
  },
  inputText: {
    ...typography.body18Medium,
    color: colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: colors.cta,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.base,
    ...typography.body18Medium,
  },
  switchContainer: {
    marginVertical: spacing.lg,
    alignItems: 'center',
  },
  switchText: {
    color: colors.textSecondary,
    ...typography.body16Regular,
  },
  socialButton: {
    flexDirection: 'row',
    width: '100%',
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.base,
    gap: spacing.sm,
  },
  socialButtonText: {
    color: colors.textPrimary,
    ...typography.body18Medium,
  },
  actions: {
    marginTop: spacing.sm,
  },
});
