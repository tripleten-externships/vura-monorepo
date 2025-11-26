import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { BottomNavBar } from '../../components/BottomNavBar';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationStore } from '../../store/StoreContext';
import { ImageUpload, ImageUploadChangeEvent } from '../../components/ImageUpload/ImageUpload';

const ProfileScreen = observer(() => {
  const { currentUser } = useAuth({});
  const notificationStore = useNotificationStore();

  useEffect(() => {
    notificationStore.fetchNotifications({ take: 5 });
    notificationStore.refreshUnread();
  }, [notificationStore]);

  const handleImageChange = useCallback((event: ImageUploadChangeEvent) => {
    if (event.asset?.uri) {
      console.log(`Selected ${event.source} image:`, event.asset.uri);
    }
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {currentUser ? (
        <View style={styles.card}>
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

      <ImageUpload
        label="Profile photo"
        helperText="Take a new photo or choose one from your library."
        onChange={handleImageChange}
      />

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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  meta: {
    color: '#555',
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
});

export default ProfileScreen;
