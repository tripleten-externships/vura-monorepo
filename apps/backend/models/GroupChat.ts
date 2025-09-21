import { list } from '@keystone-6/core';
import type { Lists } from '.keystone/types';
import { relationship, text, timestamp, checkbox } from '@keystone-6/core/fields';

export const GroupChat = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      query: ({ session }) => ({
        id: { equals: session.data.id },
      }),
    },
    item: {
      update: ({ session, item }) => item.id === session.data.id,
      delete: ({ session, item }) => item.id === session.data.id,
    },
  },
  fields: {
    groupName: text({ validation: { isRequired: true } }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    updatedAt: timestamp({
      db: {
        updatedAt: true,
        map: 'updated_at',
      },
    }),
  },
});
