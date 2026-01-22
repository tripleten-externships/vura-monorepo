import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useMutation } from '@apollo/client/react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

// import { useNavigationHistory } from '../../navigation/NavigationHistoryProvider';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
import { ToggleSwitch } from '../../components/ToggleSwitch/ToggleSwitch';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { useCamera } from '../../hooks/useCamera';
import { useImageLibrary } from '../../hooks/useImageLibrary';
import { useAuth } from '../../hooks/useAuth';
import { UPDATE_PROFILE } from '../../graphql/mutations/users';
import { GET_USER_PROFILE } from '../../graphql/queries/users';
import { colors, radii, spacing, typography } from '../../theme/designTokens';

import { client } from '../../store';

const ProfileScreen = observer(() => {
  const navigate = useNavigate();
  // const { goBack } = useNavigationHistory();
  const { logout, currentUser } = useAuth({});
  const { hasUnread } = useUnreadNotifications();

  const [hideAvatar, setHideAvatar] = useState(currentUser?.privacyToggle ?? false);
  const [updatingField, setUpdatingField] = useState<'name' | 'age' | 'gender' | 'email' | null>(
    null
  );
  const [updatedValue, setUpdatedValue] = useState<string>('');
  const [privacySaving, setPrivacySaving] = useState(false);
  const pendingPrivacyToggleRef = useRef<boolean | null>(null);
  const lastKnownNameRef = useRef<string | null>(currentUser?.name ?? null);
  const lastKnownAvatarRef = useRef<string | null>(currentUser?.avatarUrl ?? null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [updateProfileMutation, { loading: avatarUpdating }] = useMutation(UPDATE_PROFILE);

  const { openCamera } = useCamera({
    defaultOptions: {
      mediaType: 'photo',
      includeBase64: true,
      saveToPhotos: false,
    },
  });
  const { openImageLibrary } = useImageLibrary({
    defaultOptions: {
      mediaType: 'photo',
      includeBase64: true,
      selectionLimit: 1,
    },
  });

  useEffect(() => {
    if (typeof currentUser?.privacyToggle !== 'boolean') {
      return;
    }
    const nextValue = currentUser.privacyToggle;
    if (pendingPrivacyToggleRef.current !== null && pendingPrivacyToggleRef.current !== nextValue) {
      return;
    }
    pendingPrivacyToggleRef.current = null;
    setHideAvatar(nextValue);
  }, [currentUser?.privacyToggle]);

  useEffect(() => {
    if (currentUser?.name) {
      lastKnownNameRef.current = currentUser.name;
    }
    if (currentUser?.avatarUrl) {
      lastKnownAvatarRef.current = currentUser.avatarUrl;
    }
  }, [currentUser?.name, currentUser?.avatarUrl]);

  useEffect(() => {
    if (
      typeof currentUser?.privacyToggle === 'boolean' &&
      hideAvatar === currentUser.privacyToggle
    ) {
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        pendingPrivacyToggleRef.current = hideAvatar;
        setPrivacySaving(true);
        await updateProfileMutation({
          variables: { input: { privacyToggle: hideAvatar } as any },
        });
        const cachedProfile = client.readQuery({ query: GET_USER_PROFILE });
        if (cachedProfile?.userProfile) {
          client.writeQuery({
            query: GET_USER_PROFILE,
            data: {
              userProfile: {
                ...cachedProfile.userProfile,
                privacyToggle: hideAvatar,
              },
            },
          });
        }
      } catch (error: any) {
        Alert.alert('Privacy update failed', error?.message ?? 'Please try again.');
        pendingPrivacyToggleRef.current = null;
        setHideAvatar(currentUser?.privacyToggle ?? false);
      } finally {
        setPrivacySaving(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [hideAvatar]);

  const userInitials = useMemo(() => {
    const name = currentUser?.name ?? lastKnownNameRef.current;
    if (!name) return '??';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [currentUser?.name]);

  const avatarUrl = currentUser?.avatarUrl ?? lastKnownAvatarRef.current;

  const fallbackEmail =
    (typeof localStorage !== 'undefined' && localStorage.getItem('lastEmail')) || '—';

  const genderOptions = useMemo(
    () => [
      { label: 'Female', value: 'female' },
      { label: 'Male', value: 'male' },
      { label: 'Non-Binary', value: 'non-binary' },
    ],
    []
  );

  const formatGender = useCallback(
    (value?: string | null) => genderOptions.find((option) => option.value === value)?.label ?? '—',
    [genderOptions]
  );

  const profileRows = [
    { label: 'Name', field: 'name', value: currentUser?.name || 'Unnamed User' },
    { label: 'Age', field: 'age', value: currentUser?.age ? String(currentUser.age) : '—' },
    { label: 'Gender', field: 'gender', value: formatGender(currentUser?.gender) },
    { label: 'Email', field: 'email', value: currentUser?.email || fallbackEmail },
  ] as const;

  const applyAvatarUpdate = useCallback(
    async (dataUrl: string) => {
      if (!dataUrl) return;
      try {
        await updateProfileMutation({
          variables: { input: { avatarUrl: dataUrl } },
        });
        await client.refetchQueries({ include: [GET_USER_PROFILE] });
      } catch (error: any) {
        Alert.alert('Avatar update failed', error?.message ?? 'Please try again.');
      }
    },
    [updateProfileMutation]
  );

  const buildDataUrl = (asset?: { base64?: string | null; type?: string | null }) => {
    if (!asset?.base64) return null;
    return `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
  };

  const handleLibrarySelect = useCallback(async () => {
    try {
      const response = await openImageLibrary();
      if (response?.didCancel) return;
      const asset = response?.assets?.[0];
      const dataUrl = buildDataUrl(asset);
      if (!dataUrl) {
        Alert.alert('Avatar update failed', 'Unable to read selected image.');
        return;
      }
      await applyAvatarUpdate(dataUrl);
    } catch (error: any) {
      Alert.alert('Avatar update failed', error?.message ?? 'Unable to open library.');
    }
  }, [applyAvatarUpdate, openImageLibrary]);

  const handleCameraCapture = useCallback(async () => {
    try {
      const response = await openCamera();
      if (response?.didCancel) return;
      const asset = response?.assets?.[0];
      const dataUrl = buildDataUrl(asset);
      if (!dataUrl) {
        Alert.alert('Avatar update failed', 'Unable to capture photo.');
        return;
      }
      await applyAvatarUpdate(dataUrl);
    } catch (error: any) {
      Alert.alert('Avatar update failed', error?.message ?? 'Unable to open camera.');
    }
  }, [applyAvatarUpdate, openCamera]);

  const handleWebFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const toDataUrl = (blob: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      try {
        const dataUrl = await toDataUrl(file);
        await applyAvatarUpdate(dataUrl);
      } catch (error: any) {
        Alert.alert('Avatar update failed', error?.message ?? 'Unable to read selected file.');
      } finally {
        event.target.value = '';
      }
    },
    [applyAvatarUpdate]
  );

  const handleAvatarEdit = useCallback(() => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }
    Alert.alert('Update avatar', undefined, [
      { text: 'Take Photo', onPress: handleCameraCapture },
      { text: 'Choose Photo', onPress: handleLibrarySelect },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handleCameraCapture, handleLibrarySelect]);

  //update user profile
  const handleSave = async () => {
    if (!updatingField) return;
    const trimmedValue = updatedValue.trim();
    let nextValue: string | number;

    if (updatingField === 'age') {
      const parsedAge = Number(trimmedValue);
      if (!Number.isFinite(parsedAge)) {
        Alert.alert('Invalid age', 'Please enter a valid number.');
        return;
      }
      nextValue = parsedAge;
    } else if (updatingField === 'gender') {
      const normalized = trimmedValue.toLowerCase().replace(/\s+/g, '-');
      const matched = genderOptions.find(
        (option) => option.value === normalized || option.label.toLowerCase() === normalized
      );
      if (!matched) {
        Alert.alert('Invalid gender', 'Please use Female, Male, or Non-Binary.');
        return;
      }
      nextValue = matched.value;
    } else {
      if (!trimmedValue) {
        Alert.alert('Invalid value', 'This field cannot be empty.');
        return;
      }
      nextValue = trimmedValue;
    }

    try {
      await updateProfileMutation({
        variables: {
          input: {
            [updatingField]: nextValue,
          },
        },
      });

      await client.refetchQueries({ include: [GET_USER_PROFILE] });

      setUpdatingField(null);
      setUpdatedValue('');
    } catch (e: any) {
      const message = e?.message ?? 'Update failed';
      if (/authentication required|user must be authenticated/i.test(message)) {
        Alert.alert('Session expired', 'Please sign in again.');
      }
      console.error('Update failed:', message);
    }
  };
  //log out the user and navigate to the start page
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Profile"
          titleStyle={{ fontFamily: 'Inter !important' }}
          rightIcon={{
            icon: (
              <NotificationBell hasUnread={hasUnread} onClick={() => navigate('/notifications')} />
            ),
          }}
        />

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              {avatarUrl && !hideAvatar ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{userInitials}</Text>
              )}
              {avatarUpdating ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : null}
            </View>
            <Pressable style={styles.avatarEdit} onPress={handleAvatarEdit}>
              <Image
                source={{ uri: '../../../assets/pen.svg' }}
                style={[{ width: 16, height: 16 }]}
              />
            </Pressable>
          </View>
          <Text style={styles.name}>
            {hideAvatar ? userInitials : currentUser?.name || 'Unnamed User'}
          </Text>
          <Text style={styles.meta}>{currentUser?.email || ''}</Text>
        </View>

        <View style={styles.toggleCard}>
          <View style={styles.toggleTextContainer}>
            <Text style={styles.toggleTitle}>Hide my avatar, and display my name as initials</Text>
          </View>
          <ToggleSwitch value={hideAvatar} onValueChange={setHideAvatar} />
          {privacySaving ? <ActivityIndicator size="small" color="#666" /> : null}
        </View>

        <View style={styles.infoCard}>
          {profileRows.map((row, index) => (
            <View
              key={row.label}
              style={[styles.infoRow, index === profileRows.length - 1 && styles.infoRowLast]}
            >
              <View>
                <Text style={styles.infoLabel}>{row.label}</Text>
                {updatingField === row.field ? (
                  <input
                    value={updatedValue}
                    onChange={(e) => setUpdatedValue(e.target.value)}
                    type={row.field === 'age' ? 'number' : 'text'}
                    style={styles.updateInput}
                  />
                ) : (
                  <Text style={styles.infoValue}>{row.value}</Text>
                )}
              </View>

              {updatingField === row.field ? (
                <View style={styles.updatingFieldView}>
                  {/* save updated value */}
                  <Pressable onPress={handleSave}>
                    <FontAwesomeIcon icon={faCheck} style={{ fontSize: 19 }} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setUpdatingField(null);
                      setUpdatedValue('');
                    }}
                  >
                    {/* Cancel updated value */}
                    <FontAwesomeIcon icon={faXmark} style={{ fontSize: 19 }} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    setUpdatingField(row.field);
                    setUpdatedValue(row.value === '—' ? '' : row.value);
                  }}
                >
                  <Image
                    source={{ uri: '../../../assets/pen.svg' }}
                    style={{ width: 16, height: 16 }}
                  />
                </Pressable>
              )}
            </View>
          ))}
        </View>
        {/*logout button: navigate to start page*/}
        <Pressable onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </Pressable>
        {/*delete button: delete user account*/}
        <Link to="/delete-account" style={styles.dangerLink}>
          Delete Account
        </Link>
        <Link to="/privacy-policy" style={styles.link}>
          Privacy Policy
        </Link>
        {Platform.OS === 'web'
          ? React.createElement('input', {
              type: 'file',
              accept: 'image/*',
              ref: fileInputRef,
              style: { display: 'none' },
              onChange: handleWebFileChange,
            })
          : null}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.base,
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 2 + spacing.sm,
    width: '100%',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: radii.avatar,
    backgroundColor: colors.cta,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: radii.avatar,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: colors.base,
    fontSize: 40,
    fontWeight: '600',
  },
  avatarEdit: {
    position: 'absolute',
    bottom: -6,
    right: 34,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.stroke,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditIcon: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  name: {
    ...typography.body18Medium,
    fontSize: 20,
    color: colors.textPrimary,
  },
  meta: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    ...typography.body16Regular,
  },
  toggleCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  toggleTextContainer: {
    width: '75%',
  },
  toggleTitle: {
    ...typography.body16Regular,
    color: colors.textPrimary,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.stroke,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    ...typography.body18Medium,
    fontSize: 18,
    color: colors.textPrimary,
  },
  updatingFieldView: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  updateInput: {
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: spacing.xs,
    marginTop: spacing.xs,
    width: 250,
    borderRadius: 8,
  },
  link: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    ...typography.body16Regular,
  },
  dangerLink: {
    textAlign: 'center',
    color: colors.danger,
    // marginBottom: spacing.lg,
    ...typography.body16Medium,
  },
  logout: {
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    ...typography.body18Medium,
  },
});

export default ProfileScreen;
