import { list } from '@keystone-6/core';
import type { Lists } from '.keystone/types';
import { text, select, json, timestamp, relationship } from '@keystone-6/core/fields';

export const AiChatSession = list({
  access: {
    operation: {
      query: ({ session }) => !!session,
      create: ({ session }) => !!session,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      query: ({ session }) => ({
        user: { id: { equals: session?.data?.id } },
      }),
    },
    item: {
      // admin can update/delete any session, or user can update/delete their own session
      update: ({ session, item }) => {
        if (!session?.data?.id) return false;
        return session.data.isAdmin || item.userId === session.data.id;
      },
      delete: ({ session, item }) => {
        if (!session?.data?.id) return false;
        return session.data.isAdmin || item.userId === session.data.id;
      },
    },
  },
  fields: {
    title: text({
      validation: { isRequired: false },
      defaultValue: '',
    }),
    status: select({
      type: 'enum',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Completed', value: 'completed' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'active',
      validation: { isRequired: true },
    }),
    metadata: json({
      defaultValue: {},
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    updatedAt: timestamp({
      defaultValue: { kind: 'now' },
      db: { updatedAt: true },
    }),
    lastActiveAt: timestamp({
      defaultValue: { kind: 'now' },
      db: { updatedAt: true },
    }),
    // relationship to User
    user: relationship({
      ref: 'User.aiChatSessions',
      many: false,
    }),

    // relationship to AiMessages
    messages: relationship({
      ref: 'AiMessage.session',
      many: true,
    }),
  },
  hooks: {
    beforeOperation: async ({ operation, resolvedData, context }) => {
      // update lastActiveAt on any update operation
      if (operation === 'update') {
        resolvedData.lastActiveAt = new Date();
      }
    },
  },
});
