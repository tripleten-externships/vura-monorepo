import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useNotificationStore } from '../store/StoreContext';

export const useUnreadNotifications = () => {
  const { currentUser } = useAuth({});
  const notificationStore = useNotificationStore();
  const [hasUnread, setHasUnread] = useState(notificationStore.unreadCount > 0);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) return;
    await Promise.all([notificationStore.fetchNotifications(), notificationStore.refreshUnread()]);
  }, [currentUser, notificationStore]);

  useEffect(() => {
    if (!currentUser) {
      setHasUnread(false);
      return;
    }
    refreshNotifications();
  }, [currentUser, refreshNotifications]);

  useEffect(() => {
    if (!currentUser) {
      setHasUnread(false);
      return;
    }
    setHasUnread(notificationStore.unreadCount > 0);
  }, [currentUser, notificationStore.unreadCount]);

  return { hasUnread, refreshNotifications };
};
