// apps/backend/api/middlewares/auth.ts
import { createAuth } from '@keystone-6/auth';
import { statelessSessions } from '@keystone-6/core/session';
import type { Session } from '../../types/context'; // adjust path if needed

// Fail fast in prod if secret missing
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET must be set in production');
}

const sessionSecret = process.env.SESSION_SECRET || 'dev-only-secret';
const sessionMaxAge = 60 * 60 * 24 * 30; // 30 days

export const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'password',
  sessionData: 'id name role',
  initFirstItem: {
    fields: ['name', 'email', 'password', 'role'],
    // itemData: { role: 'admin' }, // uncomment if you want first user to be admin
  },
});

export const session = statelessSessions({
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

// Convenience booleans for Keystone access blocks
export const isAuthenticated = ({ session }: { session?: Session }) => !!session?.data;
export const isAdmin = ({ session }: { session?: Session }) => session?.data?.role === 'admin';
export const isOwnerOrAdmin = ({ session, item }: { session?: Session; item?: { id?: string; authorId?: string } }) => {
  if (!session?.data) return false;
  if (session.data.role === 'admin') return true;
  // If your item uses `author` relationship, Keystone exposes `item.authorId`
  // Otherwise fall back to item.id === user.id if it's a user-owned record
  return item?.authorId === session.data.id || item?.id === session.data.id;
};
