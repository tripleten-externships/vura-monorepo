# Role-Based Access Control (RBAC) Implementation

## Overview

This implementation adds role-based access control to the Vura application using Keystone's built-in access control features. The system now supports two user roles:

- **Admin users**: Can access and modify all data
- **Regular users**: Can only access and modify their own data

## Changes Made

### 1. Created RBAC Utility Functions (`utils/rbac.ts`)

- `isAdmin()`: Check if user has admin privileges
- `isLoggedIn()`: Check if user is authenticated
- `isOwner()`: Check if user owns a specific item
- `isAdminOrOwner()`: Combined admin or ownership check
- `requireAuth()`: Require user to be logged in
- `requireAdmin()`: Require user to be admin
- `createUserFilter()`: Create filters based on user role

### 2. Updated User Model (`models/user.ts`)

**Access Control:**

- Admins can see all users, regular users can only see themselves
- Anyone can create users (for registration)
- Only logged-in users can update profiles
- Only admins can delete users

**Field-Level Security:**

- `isAdmin` field is now protected - only admins can view/modify admin status
- New users are regular users by default (not admin)

### 3. Updated Admin UI Access (`keystone.ts`)

- Only admin users can access the Keystone Admin UI
- Regular users are redirected away from admin interface

### 4. Updated CarePlan Model (`models/care-plan.ts`)

**Access Control:**

- Only logged-in users can view/create/update care plans
- Admins can see all care plans
- Regular users can only see their own care plans
- Only admins can delete care plans

## How It Works

### For Admin Users:

- Can access admin UI at `/admin/ui`
- Can view and modify all data across the system
- Can promote/demote other users to/from admin status
- Can delete any data

### For Regular Users:

- Cannot access admin UI
- Can only view and modify their own data
- Cannot see admin status of any users
- Cannot delete data (except their own profile updates)

### For Unauthenticated Users:

- Can register new accounts
- Cannot access any protected data
- Must log in to use the application

## Security Benefits

1. **Data Isolation**: Users can only access their own data
2. **Administrative Control**: Clear separation between admin and user privileges
3. **Principle of Least Privilege**: Users get minimum necessary permissions
4. **Field-Level Security**: Sensitive fields like admin status are protected

## Testing the Implementation

1. Create a regular user account
2. Try to access `/admin/ui` (should be denied)
3. Create an admin user and test admin access
4. Verify that regular users can only see their own care plans
5. Test that only admins can modify user admin status

## Future Enhancements

- Add role-based access to other models (ForumPost, ChatMessage, etc.)
- Implement more granular permissions (e.g., moderator role)
- Add audit logging for admin actions
- Implement API rate limiting based on user roles
