import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';

export default function ChecklistScreen() {
  const navigate = useNavigate();
  const { hasUnread } = useUnreadNotifications();
  return (
    <View style={styles.container}>
      <PageHeader
        title="Your care action plan"
        rightIcon={{
          icon: (
            <NotificationBell hasUnread={hasUnread} onClick={() => navigate('/notifications')} />
          ),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  topIcon: {
    width: 100,
    height: 100,
  },
});
