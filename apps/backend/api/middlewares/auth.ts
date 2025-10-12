// guard helpers (requireAuth, requireRole)
// middlewares/auth.ts
import { createAuth } from '@keystone-6/auth';
import { statelessSessions } from '@keystone-6/core/session';

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
