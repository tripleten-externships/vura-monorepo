import { list } from '@keystone-6/core';
import type { Lists } from '.keystone/types';
import { checkbox, text, relationship, password, timestamp } from '@keystone-6/core/fields';

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
      validation: {
        length: { min: 10, max: 100 },
        isRequired: true,
        rejectCommon: true,
      },
      bcrypt: require('bcryptjs'),
    }),
    messages: relationship({ ref: 'ChatMessage.sender', many: true }),

    isAdmin: checkbox({ defaultValue: true }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    lastLoginDate: timestamp({
      defaultValue: { kind: 'now' },
    }),
  },
});
