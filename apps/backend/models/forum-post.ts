import { list } from '@keystone-6/core';
import { text, checkbox, timestamp, relationship, select, json } from '@keystone-6/core/fields';
import { isAdmin, isLoggedIn, isAdminOrOwner } from '../utils/rbac';

export const ForumPost = list({
  access: {
    operation: {
      // Only logged-in users can view forum posts
      query: ({ session }) => isLoggedIn(session),
      // Only logged-in users can create forum posts
      create: ({ session }) => isLoggedIn(session),
      // Only logged-in users can update forum posts
      update: ({ session }) => isLoggedIn(session),
      // Only admins can delete any post, or users can delete their own
      delete: ({ session }) => isLoggedIn(session),
    },
    filter: {
      // Only logged-in users can see posts
      query: ({ session }) => {
        if (!isLoggedIn(session)) return false;
        // All logged-in users can see all posts
        return true;
      },
    },
    item: {
      // Users can update their own posts, admins can update any
      update: ({ session, item }) => isAdminOrOwner(session, item),
      // Users can delete their own posts, admins can delete any
      delete: ({ session, item }) => isAdminOrOwner(session, item),
    },
  },
  fields: {
    title: text({
      validation: { isRequired: true, length: { max: 30 } },
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
    // type of forum post for notification
    forumPostType: select({
      options: [
        { label: 'New Post', value: 'NEW_POST' },
        { label: 'Reply to Your Post', value: 'REPLY_TO_YOUR_POST' },
        { label: 'Reply to Subscribed Post', value: 'REPLY_TO_SUBSCRIBED_POST' },
      ],
      validation: { isRequired: true },
      db: { isNullable: false },
    }),
    priority: select({
      options: [
        { label: 'Low', value: 'LOW' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'High', value: 'HIGH' },
        { label: 'Urgent', value: 'URGENT' },
      ],
      defaultValue: 'MEDIUM',
      validation: { isRequired: true },
      db: { isNullable: false },
    }),
    metadata: json({
      defaultValue: {},
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    updatedAt: timestamp({
      db: { updatedAt: true },
    }),
    subscribers: relationship({
      ref: 'ForumSubscription.forumPost',
      many: true,
      ui: {
        displayMode: 'select',
      },
    }),
    author: relationship({
      ref: 'User.forumPost',
      many: false,
    }),
  },
});
