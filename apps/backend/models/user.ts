import { list } from '@keystone-6/core';
import { checkbox, text, password, timestamp, relationship } from '@keystone-6/core/fields';

export const User = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      query: ({ session }) => ({
        id: { equals: session.data.id },
      }),
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
      validation: {
        length: { min: 10, max: 100 },
        isRequired: true,
        rejectCommon: true,
      },
      bcrypt: require('bcryptjs'),
    }),
    isAdmin: checkbox({ defaultValue: true }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    lastLoginDate: timestamp({
      defaultValue: { kind: 'now' },
    }),
    // relationship to AiChatSessions
    aiChatSessions: relationship({
      ref: 'AiChatSession.user',
      many: true,
    }),

    // relationship to GroupChat
    ownedChats: relationship({ ref: 'GroupChat.owner', many: true }),
    memberChats: relationship({ ref: 'GroupChat.members', many: true }),
    // relationship to forumPost
    forumPost: relationship({ ref: 'ForumPost.author', many: true }),
  },
});
