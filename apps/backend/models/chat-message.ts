import { list } from '@keystone-6/core';
import { text, relationship, timestamp, integer } from '@keystone-6/core/fields';
import { isItemAccess } from '../utils/access';

// ChatMessage model to store messages in a group chat. Each message belongs to one group chat and one sender (user)
export const ChatMessage = list({
  fields: {
    message: text({ validation: { isRequired: true } }),
    createdAt: timestamp({ defaultValue: { kind: 'now' } }),
    group: relationship({
      ref: 'GroupChat.messages',
      many: false,
    }),
    sender: relationship({ ref: 'User.messages', many: false }),
  },

  // access: {
  //   operation: {
  //     query: () => true,
  //     create: ({ session }) => !!session?.data,
  //     update: ({ session, item }) => session?.data?.id === item.sender?.id,
  //     delete: ({ session, item }) => session?.data?.id === item.sender?.id,
  //   },
  // },

  access: {
    operation: {
      query: () => true,
      create: ({ session }) => !!session?.data?.id,
      update: (args) => {
        const { session } = args;
        if (!session?.data?.id || !isItemAccess(args)) return false;
        return session.data.id === args.item.sender?.id;
      },
      delete: (args) => {
        const { session } = args;
        if (!session?.data?.id || !isItemAccess(args)) return false;
        return session.data.id === args.item.sender?.id;
      },
    },
  },
});
