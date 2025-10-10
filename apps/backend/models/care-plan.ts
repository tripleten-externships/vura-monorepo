import { list } from '@keystone-6/core';
import { text, relationship, timestamp } from '@keystone-6/core/fields';

export const CarePlan = list({
  access: {
    operation: {
      query: () => true,
      create: ({ session }) => !!session,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      update: ({ session }) => ({ user: { id: { equals: session?.itemId } } }),
      delete: ({ session }) => ({ user: { id: { equals: session?.itemId } } }),
    },
  },
  fields: {
    title: text({
      validation: { isRequired: true },
      isIndexed: 'unique',
      db: { isNullable: false },
    }),
    user: relationship({
      ref: 'User.carePlans',
      hooks: {
        resolveInput: ({ operation, resolvedData, context }) => {
          if (operation === 'create' && !resolvedData.user && context.session) {
            return { connect: { id: context.session.itemId } };
          }
          return resolvedData.user;
        },
      },
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
      db: { map: 'created_at' },
    }),
    updatedAt: timestamp({
      db: { map: 'updated_at', updatedAt: true },
    }),
  },
});
