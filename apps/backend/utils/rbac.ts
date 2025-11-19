/**
 * RBAC (Role-Based Access Control) Utility Functions
 *
 * These functions help determine what users can and cannot do
 * based on their role (admin vs regular user)
 */

// Session type based on what's defined in auth.ts sessionData
export interface Session {
  data?: {
    id: string;
    name?: string;
    isAdmin?: boolean;
  };
}

// Item type with common ownership fields
// Note: Keystone's id is an object with toString(), not a plain string
export interface OwnedItem {
  id?: string | { toString(): string };
  userId?: string | null;
  authorId?: string | null;
}

// Check if the current user is an admin
export const isAdmin = (session?: Session | null): boolean => {
  return session?.data?.isAdmin === true;
};

// Check if the current user is logged in
export const isLoggedIn = (session?: Session | null): boolean => {
  return !!session?.data?.id;
};

// Check if the current user owns a specific item (by comparing user IDs)
export const isOwner = (session?: Session | null, item?: OwnedItem | null): boolean => {
  if (!session?.data?.id || !item) return false;

  const sessionId = session.data.id;
  const itemId = typeof item.id === 'object' && item.id !== null ? item.id.toString() : item.id;

  return sessionId === item.userId || sessionId === item.authorId || sessionId === itemId;
};

// Admin can do anything, regular users can only access their own data
export const isAdminOrOwner = (session?: Session | null, item?: OwnedItem | null): boolean => {
  return isAdmin(session) || isOwner(session, item);
};

// Only allow access if user is logged in
export const requireAuth = (session?: Session | null): boolean => {
  return isLoggedIn(session);
};

// Only allow access to admins
export const requireAdmin = (session?: Session | null): boolean => {
  return isAdmin(session);
};

// Create a filter that only shows data the user is allowed to see
export const createUserFilter = (session?: Session | null) => {
  // If admin, they can see everything
  if (isAdmin(session)) {
    return true;
  }

  // If regular user, they can only see their own data
  if (isLoggedIn(session) && session?.data?.id) {
    return { userId: { equals: session.data.id } };
  }

  // If not logged in, they can't see anything
  return false;
};
