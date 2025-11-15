# 🔔 Notifications & Unread Counters API – Backend Documentation

## 1. Purpose & Scope

This document defines the backend GraphQL interface and runtime behavior for the Notifications domain and Unread Counters integration, so the frontend can reliably fetch, display, and subscribe to unread badge counts.

### What this module does

- Persists notifications (Keystone `Notification` list).
- Exposes queries to page/filter notifications.
- Maintains per-user unread counters in Redis (hash with fields: `total`, plus one per `NotificationType`: `CARE_PLAN`, `CHAT`, `FORUM`, `SYSTEM`).
- Emits Pub/Sub events when unread totals change and when notifications are created.

### How Frontend should use it (now vs soon)

- Now (current):
  - Queries:
    - `unreadCount` (total)
    - `unreadCountByType(type)` (per category)
    - `notifications(input)` (paginated list with filters)
  - Subscription:
    - `unreadCountChanged { count }` (total only)

- Soon (target / separate subtask):
  - Query: `unreadCounts(input) { total, asOf, byScope { scope count } }`
  - Subscription : `unreadCountChange(input) { asOf totalk byScope delta }`
  - This replaces the current total-only surfaces with a richer, Frontend-friendly shape.

### Out of scope (handled by sister subtasks)

- Efficient Counter Queries: DB/index/caching strategy and performance of `unreadCounts`.
- Real-time Counter Updates: Publishing `unreadCountChange` with correct payload & ordering, plus cache coherence with Redis.

### Error signaling

- Uses GraphQL errors with `extensions.code`, including:
  - `UNAUTHENTICATED` (no session)
  - `BAD_USER_INPUT` (validation)
  - `NOT_FOUND`
  - `CACHE_MISS` (Redis has no value yet)
  - `INTERNAL_SERVER_ERROR`

### Security / tenancy

- All reads/writes are **scoped to the authenticated user** (`context.session.data.id`).
- Keystone list filtering restricts queries to the owner's notifications.

## 2. GraphQL Schema (Implemented)

<!-- show what actually exists in GraphQL: model fields, queries, mutations, subscriptions -->

This section documents the current interface that is live today, based on:

- `Notification` Keystone list (model)
- `customGetNotifications` query resolver
- `customGetUnreadCount` query resolver
- Service behavior in `notification.service.ts` (Rreids + pubsub)

> The updated target (aggregate `unreadCounts` + richer subscription) is defined later in this doc for the "Real-time counter updates" subtask to implement.

### Types & Enums

```graphql
"""
Keystone model fields exposed via GraphQL.
"""
type Notification {
  id: ID!
  type: String! # sub-type (e.g NEW_MESSAGE)
  notificationType: NotificationType!
  priority: NotificationPriority!
  content: String!
  actionUrl: String
  metadata: JSON
  read: Boolean!
  readAt: DateTime
  expiresAt: DateTime
  scheduledFor: DateTime
  createdAt: DateTime!
  user: User # owner; access-scoped to session user
  relatedCarePlan: CarePlan
  relatedCHat: GroupChat
  relatedForumPost: ForumPost
}

enum NotificationType {
  CARE_PLAN
  CHAT
  FORUM
  SYSTEM
}

enum NotificationPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

Return shape for the unread count query (supports optional type filter.)

```graphql
type UnreadCount {
  count: Int!
  """
  Present if the queryw as filtered by a specific NotificationType.
  """
  notificationType: NotificationType
}

input GetNotificationsInput {
  read: Boolean
  notificationType: NotificationType
  priority: NotificationPriority
  take: Int = 20
  skip: Int = 0
}

type PaginatedNotificationsResponse {
  notifications: [Notification!]!
  total: Int!
  hasMore: Boolean!
  skip: Int!
  take: Int!
}
```

#### Queries (Current)

```graphql
type Query {
  """
  Returns unread count for the authenticated user.
  If 'notificationType' is provided, returns the unread count for that category; otherwise returns the total unread across all categories.

  Errors:
  - UNAUTHENTICATED   (no session)
  - CACHE_MISS        (Redis has no value yet)
  """
  unreadCount(notificationType: NotificationType): UnreadCount!

  """
  Returns paginated notifications for the authenticated user with optional filters.

  Errors:
  - UNAUTHENTICATED  (no session)
  """
  notifications(input: GetNotificationsInput): PaginatedNotificationsResponse!
}
```

#### Mutations (current)

```graphql
"""
Provided for context -- FrontEnd may call these to mark notifications read/unread and trigger counter updates
"""
type Mutation {
  createNotification(input: CreateNotificationInput!): Notification!
  createBulkNotifications(input: CreateBulkNotificationsInput!): [Notification!]!
  markAsRead(notificationId: ID!): Notification!
  markAllAsRead: Int! # number of notifications updated
  deleteNotification(notificationId: ID!): Boolean!
}

input CreateNotificationInput {
  userId: ID!
  notificationType: NotificationType!
  type: String!
  priority: NotificationPriority = MEDIUM
  content: String!
  actionUrl: String
  metadata: JSON
  expiresAt: DateTime
  scheduledFor: DateTime
  relatedCarePlanId: ID
  relatedChatId: ID
  relatedForumPostId: ID
}

input CreateBulkNotificationsInput {
  userIds: [ID!]!
  notificationType: NotificationType!
  type: String!
  priority: NotificationPriority = MEDIUM
  content: String!
  actionUrl: String
  metadata: JSON
  expiresAt: DateTime
  scheduledFor: DateTime
  relatedCarePlanId: ID
  relatedChatId: ID
  relatedForumPostId: ID
}
```

#### Subscriptions

```graphql
type UnreadCountChanged {
  count: Int!
}

type Subcription {
  """
  Emits whenever the total unread count changes for the authenticated user.
  Triggered by createNotification, markAsRead, and markAllAsRead.
  """
  unreadCountChanged: UnreadCountChanged!
}
```

#### Runtime Notes

- Redis Hash per user:
  Key = `unread:{userId}`
  Fields = `total` + each `NotificationType` (`CARE_PLAN`, `CHAT`, `FORUM`, `SYSTEM`)
- When counters change:
  - `createNotification` -> `HINCRBY total +1` and `HINCRBY <type> +1` -> publish `UNREAD_COUNT_CHANGED`
  - `marAsRead` -> `HINCRBY total -1` and `HINCRBY <type> -1` -> publish `UNREAD_COUNT_CHANGED`.
  - `markAllAsRead` -> reset all fields to `0` -> publish `UNREAD_COUNT_CHANGED`
- Errors surfaced via GraphQL:
  `UNAUTHENTICATED`, `BAD_USER_INPUT`, `NOT_FOUND`, `CACHE_MISS`, `INTERNAL_SERVER_ERROR`.
- Access control:
  All resolvers verify `context.session.data.id`;
  Keystone list filters restrict queries to the current user.

## 3. Playground Examples

<!-- include working queries/subscriptions and sample payloads -->

> Make sure your Playground/Studio is authenticated (cookie or `Authorization: Bearer <token>`), since all resolvers read the user from `context.session.data.id`.

### Current - Queries you can run right now

#### Total unread (all categories)

**Operation**

```graphql
query UnreadTotal {
  unreadCount {
    count
  }
}

// Sample response

{
  "data": {
    "unreadCount": { "count": 17 }
  }
}
```

Errors you may see:

- `UNAUTHENTICATED` if session is missing.
- `CACHE_MISS` if Redis hasn't been seeded for this user.

#### Unread by category (`NoitificationType`)

**Operation**

```graphql
query UnreadByType($type: NotificationType!) {
  unreadCount(notificationType: $type) {
    count
    notificationType
  }
}
```

**Variables**

```json
{ "type": "CHAT" }
```

## 4. Integration Notes (for FE)

<!-- how the frontend should interact with it, including error codes and expected states -->

## 5. Badge Display – FE Best Practices

<!-- UX guidance for showing counts -->

## 6. Acceptance Criteria

<!-- checklist for QA and teammates -->

## 7. Redis Caching & PubSub

<!-- how counts are stored/published for real-time updates -->
