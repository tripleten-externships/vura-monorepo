import { list } from '@keystone-6/core';
import { text, checkbox, timestamp, relationship, select, json } from '@keystone-6/core/fields';

export const ForumPost = list({
  fields: {
    type: text({
      validation: { isRequired: true },
    }),
    // type of forum post for notification
    forumPostType: select({
      options: [
        { label: 'New Post', value: 'NEW_POST' },
        { label: 'Reply to Your Post', value: 'REPLY_TO_YOUR_POST' },
        { label: 'Reply to Subscribed Post', value: 'REPLY_TO_SUBSCRIBED_POST' },
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
    // relationship between forum posts and their notifications
    notifications: relationship({
      ref: 'Notification.notifications',
      many: true,
    }),
    subscribers: relationship({
      ref: 'ForumSubscription.forumPost',
      many: true,
      ui: {
        displayMode: 'select',
      },
    }),
    author: relationship({
      ref: 'User.forumPost',
      many: false,
    }),
  },
  // only allow logged-in users to query, create, update, or delete
  access: {
    operation: {
      query: ({ session }) => !!session?.data.id,
      create: ({ session }) => !!session?.data.id,
      update: ({ session }) => !!session?.data.id,
      delete: ({ session }) => !!session?.data.id,
    },
    filter: {
      query: ({ session }) => {
        if (!session?.data?.id) return false;
        return { author: { id: { equals: session.data.id } } };
      },
    },
  },
});
