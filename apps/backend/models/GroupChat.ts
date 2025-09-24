import { list } from '@keystone-6/core';
import { text, relationship, timestamp, integer } from '@keystone-6/core/fields';
import { isItemAccess } from '../utils/access';

// Needed to create group chat to configure the chat message. A group chat can have many messages, and each message belongs to one group chat
export const GroupChat = list({
  fields: {
    name: text(),
    messages: relationship({ ref: 'ChatMessage.group', many: true }),
  },
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
