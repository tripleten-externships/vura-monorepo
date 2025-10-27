import { list } from '@keystone-6/core';
import { relationship, text, timestamp } from '@keystone-6/core/fields';
import { isAuthenticated, isItemAccess, isAdmin } from '../utils/access';

export const GroupChat = list({
  access: {
    operation: {
      // Anyone can read group chats they belong to
      query: isAuthenticated,
      // Only logged in users can create new group chats
      create: isAuthenticated,
      // Only the owner or admin can update group info
      update: (args) => {
        const { session } = args;
        if (!session?.data?.id || !isItemAccess(args)) return false;
        return session.data.id === args.item.owner?.id || session.data.role === 'admin';
      },
      // Only the owner or admin can delete a group chat
      delete: (args) => {
        const { session } = args;
        if (!session?.data?.id || !isItemAccess(args)) return false;
        return session.data.id === args.item.owner?.id || session.data.role === 'admin';
      },
    },
    filter: {
      // Restrict which group chats users can read
      query: ({ session }) => {
        if (!session?.data?.id) return false;
        if (isAdmin({ session })) return true;
        return {
          OR: [
            { owner: { id: { equals: session.data.id } } },
            { members: { some: { id: { equals: session.data.id } } } },
          ],
        };
      },
    },
  },

  fields: {
    groupName: text({ validation: { isRequired: true } }),
    messages: relationship({ ref: 'ChatMessage.group', many: true }),

    owner: relationship({
      ref: 'User.ownedChats',
      db: { foreignKey: { map: 'ownerId' } },
      ui: { labelField: 'name' },
    }),

    members: relationship({
      ref: 'User.memberChats',
      many: true,
      ui: { labelField: 'name' },
    }),

    createdAt: timestamp({
      defaultValue: { kind: 'now' },
      db: { map: 'created_at' },
    }),

    updatedAt: timestamp({
      db: { updatedAt: true, map: 'updated_at' },
    }),
  },
});
