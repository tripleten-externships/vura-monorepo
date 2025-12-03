import { list } from '@keystone-6/core';
import { relationship, timestamp, integer, select } from '@keystone-6/core/fields';
import { isLoggedIn, isAdminOrOwner } from '../utils/rbac';

export const NotificationCounter = list({
  access: {
    operation: {
      query: ({ session }) => isLoggedIn(session),
      create: ({ session }) => isLoggedIn(session),
      update: ({ session }) => isLoggedIn(session),
      delete: ({ session }) => isAdminOrOwner(session),
    },
  },
  fields: {
    user: relationship({
      ref: 'User.notificationCounter',
      many: false,
      db: { foreignKey: { map: 'user' } },
    }),
    notificationType: select({
      options: [
        { label: 'Care Plan', value: 'CARE_PLAN' },
        { label: 'Chat', value: 'CHAT' },
        { label: 'Forum', value: 'FORUM' },
        { label: 'System', value: 'SYSTEM' },
      ],
      validation: { isRequired: true },
      defaultValue: 'SYSTEM',
    }),
    count: integer({
      validation: { isRequired: true },
      defaultValue: 0,
    }),
    lastUpdated: timestamp({
      defaultValue: { kind: 'now' },
    }),
  },
});
