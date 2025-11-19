import { list } from '@keystone-6/core';
import { text, relationship, timestamp } from '@keystone-6/core/fields';
import { isAdmin, isLoggedIn } from '../utils/rbac';

export const ChatMessage = list({
  fields: {
    message: text({ validation: { isRequired: true } }),
    createdAt: timestamp({ defaultValue: { kind: 'now' } }),
    group: relationship({
      ref: 'GroupChat.messages',
      many: false,
    }),
    sender: relationship({
      ref: 'User.messages',
      many: false,
    }),
  },

  access: {
    operation: {
      // Logged-in users can query chat messages (filtered by group membership)
      query: ({ session }) => isLoggedIn(session),
      // Only logged-in users can create chat messages
      create: ({ session }) => isLoggedIn(session),
      // Only logged-in users can update messages
      update: ({ session }) => isLoggedIn(session),
      // Only logged-in users can delete messages
      delete: ({ session }) => isLoggedIn(session),
    },
    item: {
      // Users can only update their own messages, admins can update any
      update: ({ session, item }) => {
        if (isAdmin(session)) return true;
        if (!isLoggedIn(session) || !session?.data?.id) return false;
        return session.data.id === item.senderId;
      },
      // Users can only delete their own messages, admins can delete any
      delete: ({ session, item }) => {
        if (isAdmin(session)) return true;
        if (!isLoggedIn(session) || !session?.data?.id) return false;
        return session.data.id === item.senderId;
      },
    },
  },
});
