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

import { useNavigationHistory } from '../../navigation/NavigationHistoryProvider';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
import { ToggleSwitch } from '../../components/ToggleSwitch/ToggleSwitch';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { useCamera } from '../../hooks/useCamera';
import { useImageLibrary } from '../../hooks/useImageLibrary';
import { useAuth } from '../../hooks/useAuth';
import { UPDATE_PROFILE } from '../../graphql/mutations/users';
import { GET_USER_PROFILE } from '../../graphql/queries/users';

import { client } from '../../store';

const ProfileScreen = observer(() => {
  const navigate = useNavigate();
  const { goBack } = useNavigationHistory();
  const { logout, currentUser } = useAuth({});
  const { hasUnread } = useUnreadNotifications();

  const [hideAvatar, setHideAvatar] = useState(currentUser?.privacyToggle ?? false);
  const [updatingField, setUpdatingField] = useState<string | null>(null);
  const [updatedValue, setUpdatedValue] = useState<string>('');

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
    setHideAvatar(currentUser?.privacyToggle ?? false);
  }, [currentUser?.privacyToggle]);

  const userInitials = useMemo(() => {
    if (!currentUser?.name) return '??';
    return currentUser.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [currentUser?.name]);

  const profileRows = [
    { label: 'Name', value: currentUser?.name || 'Unnamed User' },
    { label: 'Age', value: currentUser?.age ? String(currentUser.age) : '—' },
    { label: 'Gender', value: currentUser?.gender || '—' },
    { label: 'Email', value: currentUser?.email || '—' },
  ];

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

    try {
      await updateProfileMutation({
        variables: {
          input: {
            [updatingField.toLowerCase()]: updatedValue,
          },
        },
      });

      await client.refetchQueries({ include: [GET_USER_PROFILE] });

      setUpdatingField(null);
      setUpdatedValue('');
    } catch (e: any) {
      console.error('Update failed:', e.message);
    }
  };
  //log out the user and navigate to the start page
  const handleLogout = async () => {
    await logout();
    navigate('/get-started');
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
              {currentUser?.avatarUrl && !hideAvatar ? (
                <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatarImage} />
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
          <Text style={styles.name}>{currentUser?.name || 'Unnamed User'}</Text>
          <Text style={styles.meta}>{currentUser?.email || ''}</Text>
        </View>

        <View style={styles.toggleCard}>
          <View style={styles.toggleTextContainer}>
            <Text style={styles.toggleTitle}>Hide my avatar, and display my name as initials</Text>
          </View>
          <ToggleSwitch value={hideAvatar} onValueChange={setHideAvatar} />
        </View>

        <View style={styles.infoCard}>
          {profileRows.map((row, index) => (
            <View
              key={row.label}
              style={[styles.infoRow, index === profileRows.length - 1 && styles.infoRowLast]}
            >
              <View>
                <Text style={styles.infoLabel}>{row.label}</Text>
                {updatingField === row.label ? (
                  <input
                    value={updatedValue}
                    onChange={(e) => setUpdatedValue(e.target.value)}
                    style={styles.updateInput}
                  />
                ) : (
                  <Text style={styles.infoValue}>{row.value}</Text>
                )}
              </View>

              {updatingField === row.label ? (
                <View style={styles.updatingFieldView}>
                  {/* save updated value */}
                  <Pressable onPress={handleSave}>
                    <Text style={{ fontSize: 19 }}>✅</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setUpdatingField(null);
                      setUpdatedValue('');
                    }}
                  >
                    {/* Cancel updated value */}
                    <Text style={{ fontSize: 16 }}>❌</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    setUpdatingField(row.label);
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
        <Link to="/privacy-policy" style={styles.link}>
          Privacy Policy
        </Link>
        {/*logout button: navigate to start page*/}
        <Pressable onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </Pressable>
        {/*delete button: delete user account*/}
        <Link to="/delete-account" style={styles.dangerLink}>
          Delete Account
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
    backgroundColor: '#F7F5F8',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
  },
  avatarEdit: {
    position: 'absolute',
    bottom: -9,
    right: 34,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditIcon: {
    fontSize: 12,
    color: '#111',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },
  meta: {
    color: '#8A8A8E',
    marginTop: 4,
  },
  toggleCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  toggleTextContainer: {
    width: '75%',
  },
  toggleTitle: {
    fontSize: 15,
    color: '#111',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFF4',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8A8A8E',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#111',
  },
  updatingFieldView: {
    flexDirection: 'row',
    gap: 10,
  },
  updateInput: {
    borderWidth: 1,
    padding: 4,
    marginTop: 2,
    width: 250,
    borderRadius: 4,
  },
  link: {
    textAlign: 'center',
    color: '#8A8A8E',
    marginBottom: 12,
  },
  dangerLink: {
    textAlign: 'center',
    color: '#FF3B30',
    marginBottom: 32,
  },
  logout: {
    color: '#363636',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '400',
  },
});

export default ProfileScreen;
