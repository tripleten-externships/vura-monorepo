import { list } from '@keystone-6/core';
import { text, checkbox, timestamp, relationship } from '@keystone-6/core/fields';

export const Notification = list({
  fields: {
    type: text({
      validation: { isRequired: true },
      isIndexed: 'unique',
    }),
    content: text({
      validation: { isRequired: true },
    }),
    read: checkbox({ defaultValue: false }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    user: relationship({
      ref: 'User.notifications',
      many: false,
    }),
  },
  access: {
    operation: {
      query: ({ session }) => !!session?.data.id,
      create: ({ session }) => !!session?.data.id,
      update: ({ session }) => !!session?.data.id,
      delete: ({ session }) => !!session?.data.id,
    },
    filter: {
      query: ({ session }) => ({
        id: { equals: session.data.id },
      }),
    },
  },
});
