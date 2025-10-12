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

/*Authentication & Authorization Checklist

 Setup & Config
- [x] Created `access.ts` with authentication and authorization helpers
- [x] Added these helpers:
  - [x] `isAuthenticated`
  - [x] `isAdmin`
  - [x] `canAccessOwnData`
- [x] Checked that Keystone session and JWT are correctly configured
- [x] Confirmed `sessionSecret` is included in `.env`

 Authentication
- [ ] Hook up these helpers to relevant Keystone lists (User, CarePlan, Resource)
- [ ] Protect sensitive queries/mutations with `isAuthenticated`
- [ ] Verify login and session creation; make sure JWT is issued
- [ ] Ensure public resources are visible to unauthenticated users only

 Authorization
- [ ] Users can only access their own data via `canAccessOwnData`
- [ ] Admins bypass access restrictions
- [ ] Make sure roles exist in the User model (`user` and `admin`)
- [ ] Create an admin account for testing

 Public Access
- [ ] Create queries or endpoints for public resources
- [ ] Allow unauthenticated users to generate temporary care plans

 JWT
- [ ] Ensure Keystone sessions use JWT (stateless or stored)
- [ ] Set session expiration (ex: 30 days)
- [ ] Confirm JWTs are decoded correctly in session context
- [ ] Test logout to make sure tokens are invalidated

 Optional: Third-Party Auth
- [ ] Explore Keystone OAuth for Google login
- [ ] Register app in Google Developer Console
- [ ] Add OAuth client ID/secret to `.env`
- [ ] Test Google login flow

 Testing
- [ ] Seed test users (admin and regular)
- [ ] Test CRUD operations for both user types
- [ ] Confirm unauthorized access is blocked
- [ ] Test GraphQL Playground access control

 Final Steps
- [ ] Remove `initFirstItem` before going to production
- [ ] Update `.env.example` with all required variables
- [ ] Commit and push changes
- [ ] Review access and auth with team
*/
