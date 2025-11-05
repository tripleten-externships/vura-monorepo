import { list } from '@keystone-6/core';
import type { Lists } from '.keystone/types';
import {
  checkbox,
  text,
  password,
  timestamp,
  relationship,
  integer,
  select,
} from '@keystone-6/core/fields';
import { isAdmin, isLoggedIn, isAdminOrOwner, requireAdmin } from '../utils/rbac';

export const User = list({
  access: {
    operation: {
      // Anyone can view users (you might want to restrict this later)
      query: () => true,
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
    name: text({ validation: { isRequired: true } }),
    email: text({
      validation: { isRequired: true },
      isIndexed: 'unique',
    }),
    password: password({
      //keystone password field automatically hashes password
      validation: {
        length: { min: 10, max: 100 },
        isRequired: true,
        rejectCommon: true,
      },
      bcrypt: require('bcryptjs'),
    }),
    avatarUrl: text({
      validation: {
        isRequired: false,
        // commenting out the regex validation temporarily until we are able to add a default avatar
        // match: { regex: /^https?:\/\/.+/i, explanation: 'Avatar must be a valid URL' }, // ensure that the string contains http:// or https:// and at least one letter after
      },
    }),
    age: integer({
      validation: { isRequired: false },
    }),
    gender: select({
      options: [
        { label: 'Female', value: 'female' },
        { label: 'Male', value: 'male' },
        { label: 'Non-Binary', value: 'non-binary' },
      ],
      validation: { isRequired: false },
    }),
    privacyToggle: checkbox({ defaultValue: true }), //relationship to chat messages
    messages: relationship({ ref: 'ChatMessage.sender', many: true }),

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
    }),
    lastLoginDate: timestamp({
      defaultValue: { kind: 'now' },
    }), // manually updated lastLoginDate
    lastUpdateDate: timestamp({
      db: { updatedAt: true },
    }),
    carePlan: relationship({ ref: 'CarePlan.user', many: true }),
    aiChatSessions: relationship({
      ref: 'AiChatSession.user',
      many: true,
    }),
    parents: relationship({
      ref: 'Parent.user',
      many: true,
    }),

    // relationship to GroupChat
    ownedChats: relationship({ ref: 'GroupChat.owner', many: true }),
    memberChats: relationship({ ref: 'GroupChat.members', many: true }),
    // relationship to forumPost
    forumPost: relationship({ ref: 'ForumPost.author', many: true }),

    // relationship to questionnaire responses
    questionnaireResponses: relationship({
      ref: 'QuestionnaireResponse.user',
      many: true,
    }),

    // relationship to notifications
    notifications: relationship({
      ref: 'Notification.user',
      many: true,
    }),
  },
});
