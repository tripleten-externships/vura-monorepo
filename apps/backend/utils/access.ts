import type { Session } from '../types/context';

// Framework safe access control utilities for Keystone lists.
// These helpers can be imported into any list definition ( User, CarePlan, etc.)

//  Check if the current request has a valid session
export const isAuthenticated = ({ session }: { session?: Session }): boolean => {
  return !!session?.data;
};

//  Check if the logged-in user is an admin
export const isAdmin = ({ session }: { session?: Session }): boolean => {
  return session?.data?.role === 'admin';
};

//  Allow users to access their own records, or admins to access any
export const canAccessOwnData = ({
  session,
  item,
}: {
  session?: Session;
  item?: { id?: string };
}): boolean => {
  if (!session?.data) return false; // Must be logged in
  if (session.data.role === 'admin') return true; // Admins override
  return item?.id === session.data.id; // User can access only their own record
};

// Narrow type guard for Keystone's { item } argument
export const isItemAccess = (args: unknown): args is { item: any } => {
  return typeof args === 'object' && args !== null && 'item' in args;
};
