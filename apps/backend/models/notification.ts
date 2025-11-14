import { list } from '@keystone-6/core';
import { text, checkbox, timestamp, relationship, select, json } from '@keystone-6/core/fields';

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
    notifications: relationship({
      ref: 'ForumPost.notifications',
      many: true,
    }),
  },
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
        return { user: { id: { equals: session.data.id } } };
      },
    },
  },
});
