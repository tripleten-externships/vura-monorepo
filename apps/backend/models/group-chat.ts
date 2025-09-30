import { list } from '@keystone-6/core';
import { relationship, text, timestamp } from '@keystone-6/core/fields';
import { isItemAccess } from '../utils/access';

export const GroupChat = list({
  access: {
    operation: {
      query: ({}) => true,
      create: ({}) => true,
      update: (args) => {
        const { session } = args;
        if (!session?.data?.id || !isItemAccess(args)) return false;
        return session.data.id === args?.item?.owner?.id;
      },
      delete: (args) => {
        const { session } = args;
        if (!session?.data?.id || !isItemAccess(args)) return false;
        return session.data.id === args?.item?.owner?.id;
      },
    },
    filter: {
      query: ({ session }) => ({
        OR: [
          // Owner or members have read access
          { owner: { id: { equals: session?.data?.id } } },
          { members: { some: { id: { equals: session?.data?.id } } } },
        ],
      }),
      update: ({ session }) => ({ owner: { id: { equals: session?.data?.id } } }),
      delete: ({ session }) => ({ owner: { id: { equals: session?.data?.id } } }),
    },
  },
  fields: {
    groupName: text({ validation: { isRequired: true } }),
    messages: relationship({ ref: 'ChatMessage.group', many: true }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
      db: { map: 'created_at' },
    }),
    updatedAt: timestamp({
      db: {
        updatedAt: true,
        map: 'updated_at',
      },
    }),

    // relationship to User
    owner: relationship({
      ref: 'User.ownedChats',
      db: { foreignKey: { map: 'ownerId' } },
    }),
    members: relationship({ ref: 'User.memberChats', many: true }),

    //messages: relationship({ ref: 'ChatMessage.group', many: true }), // needs to reference the ChatMessage model
  },
});
