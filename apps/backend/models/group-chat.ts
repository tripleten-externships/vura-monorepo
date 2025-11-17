import { list } from '@keystone-6/core';
import { relationship, text, timestamp } from '@keystone-6/core/fields';
import { isAdmin, isLoggedIn } from '../utils/rbac';

export const GroupChat = list({
  access: {
    operation: {
      // Only logged-in users can query group chats
      query: ({ session }) => isLoggedIn(session),
      // Only logged-in users can create group chats
      create: ({ session }) => isLoggedIn(session),
      // Only logged-in users can update group chats
      update: ({ session }) => isLoggedIn(session),
      // Only logged-in users can delete group chats
      delete: ({ session }) => isLoggedIn(session),
    },
    filter: {
      query: ({ session }) => {
        // Admins can see all group chats
        if (isAdmin(session)) return true;

        // Users can see chats where they are owner or member
        if (isLoggedIn(session) && session?.data?.id) {
          return {
            OR: [
              { owner: { id: { equals: session.data.id } } },
              { members: { some: { id: { equals: session.data.id } } } },
            ],
          };
        }

        // Not logged in = can't see anything
        return false;
      },
      update: ({ session }) => {
        // Admins can update any chat
        if (isAdmin(session)) return true;

        // Only owners can update their chats
        if (isLoggedIn(session) && session?.data?.id) {
          return { owner: { id: { equals: session.data.id } } };
        }

        return false;
      },
      delete: ({ session }) => {
        // Admins can delete any chat
        if (isAdmin(session)) return true;

        // Only owners can delete their chats
        if (isLoggedIn(session) && session?.data?.id) {
          return { owner: { id: { equals: session.data.id } } };
        }

        return false;
      },
    },
    item: {
      // Only owners can update their chats, admins can update any
      update: ({ session, item }) => {
        if (isAdmin(session)) return true;
        if (!isLoggedIn(session) || !session?.data?.id) return false;
        return session.data.id === item.ownerId;
      },
      // Only owners can delete their chats, admins can delete any
      delete: ({ session, item }) => {
        if (isAdmin(session)) return true;
        if (!isLoggedIn(session) || !session?.data?.id) return false;
        return session.data.id === item.ownerId;
      },
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
  },
});
