import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { InputField } from '../../components/InputField/InputField';
import Dropdown from '../../components/DropDownMenu/DropDownMenu';
import { useAuth } from '../../hooks/useAuth';
import { UPDATE_PROFILE } from '../../graphql/mutations/users';
import { GET_USER_PROFILE } from '../../graphql/queries/users';
import { client } from '../../store';
import { colors, radii, spacing, typography } from '../../theme/designTokens';

const genderOptions = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

const ProfileInfoScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth({});
  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE);
  const [name, setName] = useState(currentUser?.name ?? '');
  const [gender, setGender] = useState(currentUser?.gender ?? '');
  const [agreed, setAgreed] = useState(false);
  const [isGenderMenuOpen, setIsGenderMenuOpen] = useState(false);

  const redirect = useMemo(() => (location.state as any)?.from ?? '/care-plan', [location.state]);

  const handleSubmit = async () => {
    if (!name || !gender) {
      Alert.alert('Profile info', 'Please enter your name and gender.');
      return;
    }
    if (!agreed) {
      Alert.alert('Profile info', 'Please agree to the privacy policy.');
      return;
    }
    try {
      await updateProfile({ variables: { input: { name, gender } } });
      await client.refetchQueries({ include: [GET_USER_PROFILE] });
      navigate(redirect, { replace: true });
    } catch (error: any) {
      const message = error?.message ?? 'Unable to save profile info.';
      if (/authentication required|unauthorized|unauthenticated/i.test(message)) {
        Alert.alert('Profile info', 'Your session expired. Please sign in again.');
        navigate('/login', { state: { from: redirect } });
        return;
      }
      Alert.alert('Profile info', message);
    }
  };

  const isIncomplete = !name || !gender || !agreed;
  const isDisabled = loading;

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View>
            <Text style={styles.heading}>Profile info</Text>
            <InputField
              placeholder="Your Name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChange={setName}
              containerStyle={styles.input}
              inputStyle={styles.inputText}
            />
            <View style={styles.dropdownWrapper}>
              <Dropdown
                placeholder="Gender"
                options={genderOptions}
                selectedValue={gender}
                onSelect={setGender}
                onVisibilityChange={setIsGenderMenuOpen}
              />
            </View>
            <Text style={[styles.helperText, isGenderMenuOpen && styles.helperTextHidden]}>
              No worries about personal data! We will only show your initials to the general public
              in the app, unless you choose to show your full name in the profile setting. Read
              about how we secure your data{' '}
              <Text style={styles.link} onPress={() => navigate('/privacy-policy')}>
                here!
              </Text>
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreed((prev) => !prev)}
              activeOpacity={0.8}
              disabled={isGenderMenuOpen}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed ? <View style={styles.checkboxInner} /> : null}
              </View>
              <Text style={styles.checkboxText}>Agree to the privacy policy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (isDisabled || isIncomplete) && styles.primaryButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              <Text style={styles.primaryButtonText}>Set Up Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileInfoScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.base,
    justifyContent: 'flex-start',
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    width: '100%',
    alignItems: 'center',
    minHeight: '100%',
  },
  card: {
    flexGrow: 1,
    width: '100%',
    maxWidth: '100%',
    backgroundColor: colors.base,
    borderRadius: radii.cardLg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.xl,
    alignSelf: 'stretch',
  },
  heading: {
    ...typography.headingSerif,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
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
  dropdownWrapper: {
    marginBottom: spacing.md,
  },
  helperText: {
    color: colors.textSecondary,
    ...typography.body16Regular,
  },
  helperTextHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  link: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  actions: {
    marginTop: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  checkboxRowHidden: {
    opacity: 0,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.stroke,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.base,
  },
  checkboxChecked: {
    borderColor: colors.cta,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.cta,
  },
  checkboxText: {
    color: colors.textPrimary,
    ...typography.body16Regular,
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
});
