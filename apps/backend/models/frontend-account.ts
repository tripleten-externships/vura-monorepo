import { list } from '@keystone-6/core';
import { checkbox, password, relationship, select, text, timestamp } from '@keystone-6/core/fields';
import { isAdmin } from '../utils/rbac';

const providerOptions = [
  { label: 'Email & Password', value: 'PASSWORD' },
  { label: 'Google', value: 'GOOGLE' },
  { label: 'Apple', value: 'APPLE' },
];

export const FrontendAccount = list({
  access: {
    operation: {
      query: ({ session }) => isAdmin(session),
      create: ({ session }) => isAdmin(session),
      update: ({ session }) => isAdmin(session),
      delete: ({ session }) => isAdmin(session),
    },
  },
  fields: {
    email: text({
      validation: { isRequired: true },
      isIndexed: 'unique',
    }),
    password: password({
      validation: {
        length: { min: 10, max: 100 },
        isRequired: false,
      },
    }),
    providerType: select({
      options: providerOptions,
      defaultValue: 'PASSWORD',
      ui: {
        displayMode: 'segmented-control',
      },
    }),
    providerAccountId: text({
      validation: { isRequired: false },
      isIndexed: 'unique',
    }),
    isKeystoneUserCreated: checkbox({
      defaultValue: false,
      ui: { description: 'Tracks whether a matching Keystone user has been provisioned.' },
    }),
    lastLoginAt: timestamp({
      ui: { description: 'Set whenever the owner signs in.' },
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    updatedAt: timestamp({
      db: { updatedAt: true },
    }),
    user: relationship({
      ref: 'User.frontendAccount',
      many: false,
    }),
  },
  ui: {
    listView: {
      initialColumns: ['email', 'providerType', 'isKeystoneUserCreated'],
      initialSort: { field: 'createdAt', direction: 'DESC' },
    },
  },
});
