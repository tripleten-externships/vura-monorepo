// imports
// keystone.ts (or index.ts)
import type { Session } from '../types/context';

// This file contains helper functions for authentication and authorization

// !! ensures the result is a boolean and checks if the session exists
export const isAuthenticated = ({ session }: { session: Session }) => !!session?.data;

// Checks if the current user is an admin
export const isAdmin = ({ session }: { session: Session }) => session?.data?.role === 'admin';

// Checks if the current user can access a specific item
export const canAccessOwnData = ({ session, item }: { session: Session; item: { id: string } }) => {
  if (!session?.data) return false; // user must be logged in
  return item.id === session.data.id || isAdmin({ session }); // allow access if user owns the item or is an admin
};

// Type guard to check if object has item property
export function isItemAccess(args: any): args is { item: any } {
  return 'item' in args;
}
//Next step look in to hooking up to auth service
