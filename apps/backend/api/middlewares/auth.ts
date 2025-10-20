// guard helpers (requireAuth, requireRole)
// middlewares/auth.ts
// authentication imports
import { createAuth } from '@keystone-6/auth';
import { statelessSessions } from '@keystone-6/core/session';

// user's access field imports
import { list } from '@keystone-6/core';
import { text, relationship, timestamp, checkbox } from '@keystone-6/core/fields';

const isAdmin = ({ session }: { session?: Session }) => Boolean(session?.data.isAdmin);

// Validate the current user is themself
const isOwner = ({ session, item }: { session?: Session; item: ownerData }) =>
  session?.data.id === item.id;

// Validate the current user is an Admin, or updating themselves
const isAdminOrPerson = ({ session, item }: { session?: Session; item: ownerData }) =>
  isAdmin({ session }) || isOwner({ session, item });

// dDefine a secret for JWT/session signing
const sessionSecret = process.env.SESSION_SECRET || 'a-super-secret-string';

// define how long sessions last (in seconds)
const sessionMaxAge = 60 * 60 * 24 * 30; // 30 days

// configure Keystone Auth
export const { withAuth } = createAuth({
  listKey: 'User', // which list (model) handles auth
  identityField: 'email', // field users log in with
  secretField: 'password', // field storing the password
  sessionData: 'id name role', // data we store in the session JWT
  initFirstItem: {
    fields: ['name', 'email', 'password', 'role'], // what to collect when creating the first user
  },
});

// create a session strategy
export const session = statelessSessions({
  maxAge: sessionMaxAge,
  secret: sessionSecret,
});

// Guard Helpers
export const requireAuth = (session) => {
  if (!session?.data) {
    throw new Error('Authentication required');
  }
  return session;
};

export const requireRole = (session, role: string) => {
  if (!session?.data) {
    throw new Error('Authentication required');
  }
  if (session.data.role !== role) {
    throw new Error(`Requires ${role} role`);
  }
  return session;
};

// add expiry function -- check to see if token packages set already
// cache and validation logic for manual instance

function filterCarePlans({ session }: { session?: Session }) {
  if (session?.data.isAdmin) return true; // If session data = admin return true
  return { isPublished: { equals: true } }; // otherwise filter for published posts
}
// publicly viewable resources
export const carePlans = list({
  fields: {
    title: text(),
    isPublished: checkbox(),
    publishDate: timestamp(),
    isTemporary: checkbox({ defaultValue: false }), // for if temporary users don't have permanent data
    author: relationship({ ref: 'Person' }),
  },
  access: {
    // Anyone (even unauthenticated) can read public / temporary care plans
    operation: {
      query: () => true, // anyone can see
      create: () => true, // anyone can create
      update: isAdminOrPerson, // admins and the carePlan's owner can update
      delete: isAdminOrPerson, // admins and the carePlan's owner can delete
    },
    filter: {
      query: filterCarePlans,
    },
  },
});
