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
import { isAuthenticated, canAccessOwnData } from '../utils/access';

export const User = list({
  access: {
    operation: {
      query: isAuthenticated, // Only signed-in users can query
      create: () => true, // Anyone can register
      update: canAccessOwnData, // Only user or admin can update
      delete: canAccessOwnData, // Only user or admin can delete
    },
    filter: {
      query: ({ session }) => {
        // Restrict queries to the logged-in user unless admin
        if (!session?.data?.id) return false;
        if (session.data.role === 'admin') return true;
        return { id: { equals: session.data.id } };
      },
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

    privacyToggle: checkbox({
      defaultValue: true,
      ui: { description: 'If unchecked, profile may be visible to others' },
    }),

    // Relationships
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

    // Metadata
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
  },

  ui: {
    listView: {
      initialSort: { field: 'name', direction: 'ASC' },
      initialColumns: ['name', 'email', 'role'],
    },
  },
});
