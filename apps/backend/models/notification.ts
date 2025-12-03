import { list } from '@keystone-6/core';
import { text, checkbox, timestamp, relationship, select, json } from '@keystone-6/core/fields';
import { isAdmin, isLoggedIn } from '../utils/rbac';

export const Notification = list({
  fields: {
    type: text({
      validation: { isRequired: true },
    }),
    notificationType: select({
      options: [
        { label: 'Care Plan', value: 'CARE_PLAN' },
        { label: 'Chat', value: 'CHAT' },
        { label: 'Forum', value: 'FORUM' },
        { label: 'System', value: 'SYSTEM' },
      ],
      validation: { isRequired: true },
      db: { isNullable: false },
    }),
    priority: select({
      options: [
        { label: 'Low', value: 'LOW' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'High', value: 'HIGH' },
        { label: 'Urgent', value: 'URGENT' },
      ],
      defaultValue: 'MEDIUM',
      validation: { isRequired: true },
      db: { isNullable: false },
    }),
    content: text({
      validation: { isRequired: true },
    }),
    actionUrl: text({
      validation: { isRequired: false },
    }),
    metadata: json({
      defaultValue: {},
    }),
    read: checkbox({ defaultValue: false }),
    readAt: timestamp(),
    expiresAt: timestamp(),
    scheduledFor: timestamp(),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    user: relationship({
      ref: 'User.notifications',
      many: false,
    }),
    relatedCarePlan: relationship({
      ref: 'CarePlan',
      many: false,
    }),
    relatedChat: relationship({
      ref: 'GroupChat',
      many: false,
    }),
    relatedForumPost: relationship({
      ref: 'ForumPost',
      many: false,
    }),
  },
  access: {
    operation: {
      // Only logged-in users can query notifications
      query: ({ session }) => isLoggedIn(session),
      // Only admins can create notifications (or system)
      create: ({ session }) => isLoggedIn(session),
      // Only logged-in users can update their notifications (mark as read)
      update: ({ session }) => isLoggedIn(session),
      // Only admins can delete notifications
      delete: ({ session }) => isAdmin(session),
    },
    filter: {
      query: ({ session }) => {
        // Admins can see all notifications
        if (isAdmin(session)) return true;

        // Regular users can only see their own notifications
        if (isLoggedIn(session) && session?.data?.id) {
          return { user: { id: { equals: session.data.id } } };
        }

        // Not logged in = can't see anything
        return false;
      },
    },
    item: {
      // Users can only update their own notifications, admins can update any
      update: ({ session, item }) => {
        if (isAdmin(session)) return true;
        if (!isLoggedIn(session) || !session?.data?.id) return false;
        // Check if the notification belongs to the user (via user relationship)
        return item.userId === session.data.id;
      },
      // Only admins can delete notifications
      delete: ({ session }) => isAdmin(session),
    },
  },
});
