import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Switch,
  Platform,
  Linking,
  Pressable,
  TextInput,
} from 'react-native';
import { UPDATE_PROFILE } from '../../../src/graphql/mutations/index';
import { useMutation } from '@apollo/client';
import { launchImageLibrary } from 'react-native-image-picker';
import { observer } from 'mobx-react-lite';
import { BottomNavBar } from '../../components/BottomNavBar';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/StoreContext';
import avatar from '../../../assets/profile.png';
import pen from '../../../assets/pen.png';

const ProfileScreen = observer(() => {
  const { currentUser } = useAuth({});
  const notificationStore = useNotificationStore();

  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [privacy, setPrivacy] = useState(false);
  const [hideAvatar, setHideAvatar] = useState(false);

  const auth = useAuth({});
  const navigate = useNavigate();

  const PRIVACY_URL = process.env.VITE_PRIVACY_URL ?? 'https://privacy-url.com';
  const goToPrivacy = () => {
    if (Platform.OS === 'web') {
      window.open(PRIVACY_URL, '_blank');
    } else {
      Linking.openURL(PRIVACY_URL);
    }
  };

  const logout = async () => {
    await auth.logout();

    if (Platform.OS === 'web') {
      navigate('/get-started');
    } else {
      navigate('/get-started');
    }
  };

  useEffect(() => {
    notificationStore.fetchNotifications({ take: 5 });
    notificationStore.refreshUnread();
  }, [notificationStore]);

  return (
    <View style={styles.container}>
      {/* avatar*/}
      <Text style={styles.title}>Profile</Text>
      {currentUser ? (
        <View style={styles.card}>
          <Image source={avatar} style={styles.avatar} />
          <Text style={styles.name}>{currentUser.name || 'Unnamed User'}</Text>
          <Text style={styles.meta}>{currentUser.email}</Text>
          <Text style={styles.meta}>{currentUser.isAdmin ? 'Administrator' : 'Member'}</Text>
        </View>
      ) : (
        <Text style={styles.meta}>Loading profile...</Text>
      )}

      <Text style={styles.sectionTitle}>
        Notifications ({notificationStore.unreadCount} unread)
      </Text>
      {notificationStore.notifications.map((notification) => (
        <View key={notification.id} style={styles.notification}>
          <Text style={styles.notificationTitle}>{notification.notificationType}</Text>
          <Text style={styles.notificationContent}>{notification.content}</Text>
        </View>
      ))}
      {/* toggel */}
      <View style={styles.toggle}>
        <Text> Hide my avatar, and display my name as inicials</Text>
        <Switch value={hideAvatar} onValueChange={setHideAvatar} />
      </View>
      {/* user info */}
      {currentUser ? (
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={styles.nameContainer}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.currentValue}>{currentUser?.name}</Text>
            </View>

            <Pressable onPress={() => console.log('Edit Name')}>
              <Image source={pen} style={styles.pen} />
            </Pressable>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.nameContainer}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <Pressable onPress={() => console.log('Edit Age')}>
              <Image source={pen} style={styles.pen} />
            </Pressable>
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.nameContainer}>
              <Text style={styles.label}>Gender</Text>
              <TextInput
                value={gender}
                onChangeText={setGender}
                placeholder="Enter your gender"
                style={styles.input}
              />
            </View>
            <Pressable onPress={() => console.log('Edit Age')}>
              <Image source={pen} style={styles.pen} />
            </Pressable>
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.nameContainer}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.currentValue}>{currentUser?.email}</Text>
            </View>

            <Pressable onPress={() => console.log('Edit Name')}>
              <Image source={pen} style={styles.pen} />
            </Pressable>
          </View>
        </View>
      ) : (
        <Text style={styles.meta}>Loading profile...</Text>
      )}
      {/* action button */}
      <View style={styles.actions}>
        <Pressable onPress={goToPrivacy}>
          <Text style={styles.privacy}>Privacy Policy</Text>
        </Pressable>
        <Pressable onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </Pressable>
        <Pressable>
          <Text style={styles.delete}>Delete Account</Text>
        </Pressable>
      </View>

      <BottomNavBar />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 40,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '500',
  },
  meta: {
    color: 'rgba(54, 54, 54, 0.5)',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  notification: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  notificationTitle: {
    fontWeight: '600',
  },
  notificationContent: {
    color: '#333',
  },
  toggle: {
    width: 345,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 16,
  },
  form: {
    width: 345,
    marginTop: 12,
    marginBottom: 12,
    marginRight: 16,
    marginLeft: 16,
    backgroundColor: '#F6F4FA',
  },
  label: {
    fontSize: 16,
    color: 'rgba(54, 54, 54, 0.5)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 345,
    height: 65,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '400',
  },
  currentValue: {
    fontSize: 18,
    color: '#363636',
    marginTop: 2,
  },
  pen: {
    width: 16,
    height: 16,
  },
  actions: {
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  privacy: {
    color: 'rgba(54, 54, 54, 0.5)',
    fontSize: 18,
    fontWeight: '500',
  },
  logout: {
    color: '#363636',
    fontSize: 18,
    fontWeight: '500',
  },
  delete: {
    color: '#F12D2D',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default ProfileScreen;
