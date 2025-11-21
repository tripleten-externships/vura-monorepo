import { gql } from '../../__generated__/gql';

export const GET_NOTIFICATIONS = gql(`
  query GetNotifications($input: GetNotificationsInput) {
    customGetNotifications(input: $input) {
      notifications {
        id
        type
        notificationType
        priority
        content
        actionUrl
        metadata
        createdAt
        readAt
      }
      total
      hasMore
      skip
      take
    }
  }
`);

export const GET_UNREAD_COUNT = gql(`
  query GetUnreadCount($notificationType: NotificationType) {
    customGetUnreadCount(notificationType: $notificationType) {
      count
      notificationType
    }
  }
`);
