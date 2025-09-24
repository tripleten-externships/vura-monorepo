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
        match: { regex: /^https?:\/\/.+/i, explanation: 'Avatar must be a valid URL' }, // ensure that the string contains http:// or https:// and at least one letter after
      },
    }),
    age: integer({
      validation: { isRequired: true },
    }),
    gender: select({
      options: [
        { label: 'Female', value: 'female' },
        { label: 'Male', value: 'male' },
        { label: 'Non-Binary', value: 'non-binary' },
      ],
      validation: { isRequired: true },
    }),
    privacyToggle: checkbox({ defaultValue: true }),
    isAdmin: checkbox({ defaultValue: true }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    lastLoginDate: timestamp({
      db: { updatedAt: true },
    }),
    lastUpdateDate: timestamp({
      db: { updatedAt: true },
    }),
    parent: relationship({ ref: 'Parent.user' }),
    carePlan: relationship({ ref: 'CarePlan.user' }), // need to define only one care plan?
    aiChatSessions: relationship({
      ref: 'AiChatSession.user',
      many: true,
    }),
  },
});
