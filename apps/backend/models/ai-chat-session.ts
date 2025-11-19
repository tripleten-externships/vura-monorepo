import { list } from '@keystone-6/core';
import type { Lists } from '.keystone/types';
import { text, select, json, timestamp, relationship } from '@keystone-6/core/fields';
import { isAdmin, isLoggedIn, isAdminOrOwner } from '../utils/rbac';

export const AiChatSession = list({
  access: {
    operation: {
      // Only logged-in users can query AI chat sessions
      query: ({ session }) => isLoggedIn(session),
      // Only logged-in users can create AI chat sessions
      create: ({ session }) => isLoggedIn(session),
      // Only logged-in users can update AI chat sessions
      update: ({ session }) => isLoggedIn(session),
      // Only logged-in users can delete AI chat sessions
      delete: ({ session }) => isLoggedIn(session),
    },
    filter: {
      query: ({ session }) => {
        // Admins can see all AI chat sessions
        if (isAdmin(session)) return true;

        // Regular users can only see their own sessions
        if (isLoggedIn(session) && session?.data?.id) {
          return { user: { id: { equals: session.data.id } } };
        }

        // Not logged in = can't see anything
        return false;
      },
    },
    item: {
      // Users can update their own sessions, admins can update any
      update: ({ session, item }) => isAdminOrOwner(session, item),
      // Users can delete their own sessions, admins can delete any
      delete: ({ session, item }) => isAdminOrOwner(session, item),
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
