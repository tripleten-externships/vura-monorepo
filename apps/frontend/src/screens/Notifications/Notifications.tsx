import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNotificationStore } from '../../store/StoreContext';
import { useNavigationHistory } from '../../navigation/NavigationHistoryProvider';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function NotificationsScreen() {
  const notificationStore = useNotificationStore();
  const { goBack } = useNavigationHistory();

  useEffect(() => {
    notificationStore.fetchNotifications();
    notificationStore.refreshUnread();
  }, [notificationStore]);

  console.log(notificationStore.notifications);

  const groupedNotifications = notificationStore.notifications.reduce(
    (acc: Record<string, typeof notificationStore.notifications>, notification) => {
      const createdAt = notification.createdAt ? dayjs(notification.createdAt) : dayjs();
      let groupLabel = createdAt.format('MMM D, YYYY');

      if (dayjs().diff(createdAt, 'day') === 0) {
        const diffMinutes = dayjs().diff(createdAt, 'minute');
        if (diffMinutes < 60) {
          groupLabel = `${diffMinutes}min`;
        } else {
          const diffHours = dayjs().diff(createdAt, 'hour');
          groupLabel = `${diffHours}h`;
        }
      } else if (dayjs().diff(createdAt, 'day') === 1) {
        groupLabel = 'Yesterday';
      }

      if (!acc[groupLabel]) {
        acc[groupLabel] = [];
      }
      acc[groupLabel].push(notification);
      return acc;
    },
    {}
  );

  return (
    <View style={styles.screen}>
      <PageHeader
        title="Notifications"
        leftIcon={{
          icon: <FontAwesomeIcon icon={faChevronLeft} />,
          onPress: () => goBack('/'),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {Object.entries(groupedNotifications).map(([groupLabel, notifications]) => (
          <View key={groupLabel} style={styles.group}>
            <Text style={styles.groupLabel}>{groupLabel}</Text>

            {notifications.map((notification) => (
              <View key={notification.id} style={styles.notificationCard}>
                <Text style={styles.notificationContent}>{notification.content}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F5F8',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  content: {
    paddingBottom: 32,
  },
  group: {
    marginBottom: 24,
  },
  groupLabel: {
    color: '#8A8A8E',
    fontSize: 14,
    marginBottom: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  notificationContent: {
    color: '#2F2F2F',
    fontSize: 15,
    lineHeight: 20,
  },
});
