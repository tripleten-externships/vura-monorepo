import { list } from '@keystone-6/core';
import {
  checkbox,
  text,
  password,
  timestamp,
  relationship,
  integer,
  select,
} from '@keystone-6/core/fields';

export const User = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      query: ({ session }) => {
        if (!session?.data?.id) return false;
        return { id: { equals: session.data.id } };
      },
    },
    item: {
      update: ({ session, item }) => item.id === session.data.id,
      delete: ({ session, item }) => item.id === session.data.id,
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
    privacyToggle: checkbox({ defaultValue: true }),

    //relationship to chat messages
    messages: relationship({ ref: 'ChatMessage.sender', many: true }),

    isAdmin: checkbox({ defaultValue: true }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    lastLoginDate: timestamp({
      defaultValue: { kind: 'now' },
    }), // manually updated lastLoginDate
    lastUpdateDate: timestamp({
      db: { updatedAt: true },
    }),
    // link to careplan
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
  },
});
