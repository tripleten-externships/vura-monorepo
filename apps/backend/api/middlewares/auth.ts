// apps/backend/api/middlewares/auth.ts
import { createAuth } from '@keystone-6/auth';
import { statelessSessions } from '@keystone-6/core/session';
import type { Session } from '../../types/context'; // adjust path if needed

type AccessArgs = {
  session?: Session;
  item?: { id?: string; authorId?: string; userId?: string };
};

// Fail fast in prod if secret missing
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET must be set in production');
}

const sessionSecret =
  process.env.SESSION_SECRET?.trim() || 'thisisatemporaryfallbackkeythatisdefinitely32charslong';
// console.log('Using session secret:', sessionSecret);
console.log('Secret length:', sessionSecret.length);

const sessionMaxAge = 60 * 60 * 24 * 30; // 30 days

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'password',
  sessionData: 'id name email role',
  initFirstItem: {
    fields: ['name', 'email', 'password', 'role'],
  },
});

const session = statelessSessions({
  maxAge: sessionMaxAge,
  secret: sessionSecret,
});

// ---------- Guards ----------
export const requireAuth = (session: Session) => {
  if (!session?.data) throw new Error('Authentication required');
  return session;
};

export const requireRole = (session: Session, role: 'admin' | 'user') => {
  if (!session?.data) throw new Error('Authentication required');
  if (session.data.role !== role) throw new Error(`Requires ${role} role`);
  return session;
};

export const isAuthenticated = ({ session }: AccessArgs): boolean => !!session?.data;

export const isAdmin = ({ session }: AccessArgs): boolean => session?.data?.role === 'admin';

export const canAccessOwnData = ({ session, item }: AccessArgs): boolean => {
  if (!session?.data) return false;
  if (session.data.role === 'admin') return true;
  return (
    item?.id === session.data.id ||
    item?.authorId === session.data.id ||
    item?.userId === session.data.id
  );
};

export { withAuth, session };
