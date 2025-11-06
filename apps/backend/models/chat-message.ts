import { list } from '@keystone-6/core';
import { text, relationship, timestamp } from '@keystone-6/core/fields';
import { isItemAccess, isAuthenticated, isAdmin } from '../utils/access';

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
      query: () => true, // Everyone can read chat messages
      create: isAuthenticated, // Only signed in users can send messages
      update: (args) => {
        const { session } = args;
        if (!session?.data?.id || !isItemAccess(args)) return false;
        // Allow update if sender owns message or is admin
        return session.data.id === args.item.sender?.id || session.data.role === 'admin';
      },
      delete: (args) => {
        const { session } = args;
        if (!session?.data?.id || !isItemAccess(args)) return false;
        // Allow delete if sender owns message or is admin
        return session.data.id === args.item.sender?.id || session.data.role === 'admin';
      },
    },
  },
});
