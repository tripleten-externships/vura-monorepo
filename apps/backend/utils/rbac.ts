import type { KeystoneContext } from '@keystone-6/core/types';

/**
 * RBAC (Role-Based Access Control) Utility Functions
 *
 * These functions help determine what users can and cannot do
 * based on their role (admin vs regular user)
 */

// Check if the current user is an admin
export const isAdmin = (session: any): boolean => {
  return session?.data?.isAdmin === true;
};

// Check if the current user is logged in
export const isLoggedIn = (session: any): boolean => {
  return !!session?.data?.id;
};

// Check if the current user owns a specific item (by comparing user IDs)
export const isOwner = (session: any, item: any): boolean => {
  return session?.data?.id === item?.userId || session?.data?.id === item?.id;
};

// Admin can do anything, regular users can only access their own data
export const isAdminOrOwner = (session: any, item: any): boolean => {
  return isAdmin(session) || isOwner(session, item);
};

// Only allow access if user is logged in
export const requireAuth = (session: any): boolean => {
  return isLoggedIn(session);
};

// Only allow access to admins
export const requireAdmin = (session: any): boolean => {
  return isAdmin(session);
};

// Create a filter that only shows data the user is allowed to see
export const createUserFilter = (session: any) => {
  // If admin, they can see everything
  if (isAdmin(session)) {
    return true;
  }

  // If regular user, they can only see their own data
  if (isLoggedIn(session)) {
    return { userId: { equals: session.data.id } };
  }

  // If not logged in, they can't see anything
  return false;
};
