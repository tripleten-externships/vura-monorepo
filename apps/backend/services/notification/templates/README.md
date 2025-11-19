# Notification Templates

This directory contains notification templates for different features of the application.

## Overview

Each template file exports functions that generate notification data in a consistent format. These templates are used by the notification service to create notifications for users.

## Template Structure

All templates follow this pattern:

1. **Input Interface**: Defines the data required to generate the notification
2. **Template Functions**: Individual functions for each notification type
3. **Helper Function**: A getter function to select the appropriate template based on type

## Available Templates

### Care Plan Templates (`careplan.ts`)

Handles notifications related to care plan assignments and progress.

**Types:**

- `assigned` - When a care plan is assigned to a user
- `progress` - When a user makes progress on a care plan
- `completed` - When a user completes a care plan

**Usage:**

```typescript
import { getCarePlanNotificationTemplate } from './templates/careplan';

const notification = getCarePlanNotificationTemplate('assigned', {
  userName: 'John Doe',
  carePlanName: 'Weekly Exercise Plan',
  actionUrl: '/careplan/123',
});
```

### Chat Templates (`chat.ts`)

Handles notifications for group chat messages and mentions.

**Types:**

- `message` - New message in a group chat
- `mention` - User is mentioned in a message

**Usage:**

```typescript
import { getChatNotificationTemplate } from './templates/chat';

const notification = getChatNotificationTemplate('message', {
  groupId: 'group123',
  groupName: 'Team Chat',
  senderName: 'Jane Smith',
  message: 'Hello everyone!',
  messageId: 'msg456',
});
```

### Forum Templates (`forum.ts`)

Handles notifications for forum posts and replies.

**Types:**

- `new_post` - New post in a subscribed topic
- `reply_to_your_post` - Someone replied to user's post
- `reply_to_subscribed` - New reply in a subscribed thread

**Usage:**

```typescript
import { getForumNotificationTemplate } from './templates/forum';

const notification = getForumNotificationTemplate('reply_to_your_post', {
  postId: 'post789',
  postTitle: 'How to get started?',
  postAuthor: 'Alice Brown',
  topicTitle: 'Getting Started',
  excerpt: 'Great question! Here are some tips...',
  actionUrl: '/forum/post/789',
});
```

## Return Format

All templates return an object compatible with `CreateNotificationInput` (minus the `userId`):

```typescript
{
  type: string;                    // Notification type identifier
  notificationType: NotificationType;  // Category: CARE_PLAN, CHAT, FORUM, SYSTEM
  priority: NotificationPriority;      // LOW, MEDIUM, HIGH, URGENT
  content: string;                     // Main notification message
  actionUrl?: string;                  // URL for notification action
  metadata?: Record<string, any>;      // Additional data
  relatedCarePlanId?: string;          // Reference to care plan
  relatedChatId?: string;              // Reference to chat
  relatedForumPostId?: string;         // Reference to forum post
}
```

## Adding New Templates

When adding a new template file:

1. Import types from `../types`
2. Define an input interface for your template data
3. Create individual template functions with clear names
4. Add a helper/getter function for easy template selection
5. Ensure return type matches `Omit<CreateNotificationInput, 'userId'>`
6. Update this README with usage examples

## Best Practices

- Keep notification content concise and user-friendly
- Use appropriate priority levels:
  - `LOW`: General updates
  - `MEDIUM`: Regular interactions (default)
  - `HIGH`: Direct mentions, replies to user's content
  - `URGENT`: Critical system messages
- Include relevant metadata for filtering and tracking
- Truncate long content with ellipsis for previews
- Always include actionUrl for clickable notifications
