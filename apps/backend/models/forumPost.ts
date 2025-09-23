import { list } from '@keystone-6/core';
import { text, timestamp, relationship } from '@keystone-6/core/fields';

export const ForumPost = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      query: ({ session }) => true,
      // if(!session?.data?.id) return false;
      // return {
      //     author: {id : {equals:session.data.id}},
      // };
    },
    item: {
      update: ({ session, item }) => {
        if (!session?.data?.id) return false;
        return session?.data?.id === item.userId;
      },
      delete: ({ session, item }) => {
        if (!session?.data?.id) return false;
        return session?.data?.id === item.userId;
      },
    },
  },
  fields: {
    title: text({
      validation: { isRequired: true, length: { max: 50 } },
    }),
    topic: text({
      validation: { isRequired: true, length: { max: 50 } },
    }),
    content: text({
      validation: { isRequired: true, length: { min: 10, max: 5000 } },
      ui: {
        displayMode: 'textarea',
      },
    }),

    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    updatedAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    author: relationship({ ref: 'User.forumPost', many: true }),
    parent: relationship({ ref: 'ForumPost.child', many: false }),
    child: relationship({ ref: 'ForumPost.parent', many: true }),
    //carePlan: relationship({ref:'CarePlan.user', many:true}),
    // groupMessage : relationship({ref:'GroupMessage.group', many:true}),
  },
  hooks: {
    beforeOperation: async ({ operation, resolvedData }) => {
      if (operation === 'update') {
        resolvedData.forumPost = new Date();
      }
    },
    afterOperation: async ({ operation, item }) => {
      if (operation === 'delete') {
        console.log('Deleted item:', item);
      }
    },
  },
});
