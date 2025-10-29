import { list } from '@keystone-6/core';
import { text, relationship, timestamp, integer } from '@keystone-6/core/fields';
export const GroupChat = list({
  fields: {
    name: text(),
    messages: relationship({ ref: 'ChatMessage.group', many: true }),
  },
  access: {
    operation: {
      query: () => true,
      create: ({ session }) => !!session?.data,
      update: ({ session, item }) => session?.data?.id === item.senderId,
      delete: ({ session, item }) => session?.data?.id === item.senderId,
    },
  },
});
