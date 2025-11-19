import { makeObservable, observable, action } from 'mobx';
import type { RootStore } from './rootStore';
import { BaseStore } from './baseStore';
import { GET_NOTIFICATIONS, GET_UNREAD_COUNT } from '../graphql/queries/notifications';
import type {
  GetNotificationsInput,
  GetNotificationsQuery,
  GetUnreadCountQuery,
  NotificationType,
} from '../__generated__/graphql';

type NotificationNode = GetNotificationsQuery['customGetNotifications']['notifications'][number];

export class NotificationStore extends BaseStore {
  notifications: NotificationNode[] = [];
  unreadCount = 0;
  loading = false;
  error?: string;

  constructor(rootStore: RootStore) {
    super(rootStore);
    makeObservable(this, {
      notifications: observable,
      unreadCount: observable,
      loading: observable,
      error: observable,
      fetchNotifications: action,
      refreshUnread: action,
      reset: action,
    });
  }

  async fetchNotifications(input?: GetNotificationsInput) {
    this.loading = true;
    try {
      await this.executeQuery<GetNotificationsQuery, { input?: GetNotificationsInput }>(
        GET_NOTIFICATIONS,
        { input },
        (data) => {
          this.notifications = data.customGetNotifications.notifications;
          this.error = undefined;
        },
        (err) => {
          this.error = err.message;
        }
      );
    } finally {
      this.loading = false;
    }
  }

  async refreshUnread(notificationType?: NotificationType) {
    await this.executeQuery<GetUnreadCountQuery, { notificationType?: NotificationType }>(
      GET_UNREAD_COUNT,
      { notificationType },
      (data) => {
        this.unreadCount = data.customGetUnreadCount.count;
      }
    );
  }

  reset(): void {
    this.notifications = [];
    this.unreadCount = 0;
    this.loading = false;
    this.error = undefined;
  }
}
