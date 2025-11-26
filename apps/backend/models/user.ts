import { list } from '@keystone-6/core';
import {
  text,
  password,
  timestamp,
  relationship,
  integer,
  select,
  checkbox,
} from '@keystone-6/core/fields';
import { isAdmin, isLoggedIn, isAdminOrOwner } from '../utils/rbac';

export const User = list({
  access: {
    operation: {
      // Anyone can view users (you might want to restrict this later)
      query: ({ session }) => isLoggedIn(session),
      // Anyone can create a user (for registration)
      create: () => true,
      // Only logged-in users can update
      update: ({ session }) => isLoggedIn(session),
      // Only admins can delete users
      delete: ({ session }) => isAdmin(session),
    },
    filter: {
      query: ({ session }) => {
        // Admins can see all users
        if (isAdmin(session)) return true;

        // Regular users can only see their own profile
        if (isLoggedIn(session)) {
          return { id: { equals: session.data.id } };
        }

        // Not logged in = can't see anything
        return false;
      },
    },
    item: {
      // Users can only update their own profile, admins can update anyone
      update: ({ session, item }) => isAdminOrOwner(session, item),
      // Only admins can delete any user
      delete: ({ session }) => isAdmin(session),
    },
  },

  fields: {
    // Basic info
    name: text({ validation: { isRequired: true } }),
    email: text({
      validation: { isRequired: true },
      isIndexed: 'unique',
    }),

    // Keystone handles hashing automatically
    password: password({
      validation: {
        length: { min: 10, max: 100 },
        isRequired: true,
        rejectCommon: true,
      },
    }),
    role: select({
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
      ],
      defaultValue: 'user',
      ui: {
        displayMode: 'segmented-control',
      },
    }),
    avatarUrl: text({
      validation: { isRequired: false },
      ui: { description: 'Optional profile image URL' },
    }),

    age: integer(),
    gender: select({
      options: [
        { label: 'Female', value: 'female' },
        { label: 'Male', value: 'male' },
        { label: 'Non-Binary', value: 'non-binary' },
      ],
    }),
    privacyToggle: checkbox({ defaultValue: true }), //relationship to chat messages
    messages: relationship({ ref: 'ChatMessage.sender', many: true }),
    carePlan: relationship({ ref: 'CarePlan.user', many: true }),
    aiChatSessions: relationship({ ref: 'AiChatSession.user', many: true }),
    parents: relationship({ ref: 'Parent.user', many: true }),
    ownedChats: relationship({ ref: 'GroupChat.owner', many: true }),
    memberChats: relationship({ ref: 'GroupChat.members', many: true }),
    forumPost: relationship({ ref: 'ForumPost.author', many: true }),
    questionnaireResponses: relationship({
      ref: 'QuestionnaireResponse.user',
      many: true,
    }),
    notifications: relationship({
      ref: 'Notification.user',
      many: true,
    }),
    notificationCounter: relationship({
      ref: 'NotificationCounter.user',
      many: true,
    }),
    // Metadata

    // Only admins can view/modify admin status
    isAdmin: checkbox({
      defaultValue: false, // Changed from true to false - new users are NOT admin by default
      access: {
        read: ({ session }) => isAdmin(session), // Only admins can see who is admin
        create: ({ session }) => isAdmin(session), // Only admins can make new admins
        update: ({ session }) => isAdmin(session), // Only admins can change admin status
      },
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
      ui: { description: 'When the account was created' },
    }),
    lastLoginDate: timestamp({
      defaultValue: { kind: 'now' },
      ui: { description: 'Manually updated on login' },
    }),
    lastUpdateDate: timestamp({
      db: { updatedAt: true },
      ui: { description: 'Automatically updates on record change' },
    }),
    forumSubscriptions: relationship({
      ref: 'ForumSubscription.user',
      many: true,
    }),
  },

  ui: {
    listView: {
      initialSort: { field: 'name', direction: 'ASC' },
      initialColumns: ['name', 'email', 'role'],
    },
  },
});
