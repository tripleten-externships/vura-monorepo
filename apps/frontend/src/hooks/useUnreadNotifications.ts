import { useCallback, useEffect, useState } from 'react';
import { useNotificationStore } from '../store/StoreContext';

export const useUnreadNotifications = () => {
  const notificationStore = useNotificationStore();
  const [hasUnread, setHasUnread] = useState(notificationStore.unreadCount > 0);

  const refreshNotifications = useCallback(async () => {
    await Promise.all([notificationStore.fetchNotifications(), notificationStore.refreshUnread()]);
  }, [notificationStore]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    setHasUnread(notificationStore.unreadCount > 0);
  }, [notificationStore.unreadCount]);

  return { hasUnread, refreshNotifications };
};
