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

## 2. notifications & Unread Counters - GraphQL Surface (Implemented)

All of this hangs off:

- `Query.customGetNotifications`
- `Query.customGetUnreadCount`
- `Mutation.customCreateNotification`
- `Mutation.customMarkNotificationAsRead`
- `Mutation.customMarkAllNotificationsAsRead`
- `Subscription.notificationReceived`
- `Subscription.unreadCountChanged`

These are the entry points the frontend should use (not the raw Keystone `Notification` list).

---

### 2.1 Core notification types & enums

From `schema.graphql`:

```graphql
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

"""
Shape returned by the custom notification resolvers for a single notification
"""
type NotificationDetails {
  id: ID!
  type: String!
  notificationType: NotificationType!
  priority: NotificationPriority!
  content: String!
  actionUrl: String
  metadata: JSON
  read: JSON
  read: Boolean!
  readAt: DateTime
  createdAt: DateTime!
}

"""
Result shape for querying a paginated list of notifications.
"""
type NotificationsResult {
  notifications: [NotificationDetails!]!
  total: Int!
  hasMore: Boolean!
  skip: Int!
  take: Int!
}
```

#### 2.2 Queries

Backed by:

- `customGetUnreadCount` -> `notificationService.getUnreadCount / getUnreadCountByType`
- `customGetNotifications` -> `notificationService.getNotifications`

```graphql
type Query {
  """
  Returns unread count(s) for the authenticated user.

  If 'notificationType' is provided:
  - returns the unread count for that category only
  - `notificationType` in the response is set

  If 'notificationType' is omitted:
  - returns total unread across all categories
  - `notificationType` in the response is null

  Errors:
  - UNAUTHENTICATED   (no session.id in context)
  - BAD_USER_INPUT    (missing userId on service call - internal invariant)
  - INTERNAL_SERVER_ERROR
  """
  unreadCount(notificationType: NotificationType): UnreadCount!

  """
  Returns paginated notifications for the authenticated user with optional filters.

  Filters:
  - read: filter by read/unread
  - notificationType: CARE_PLAN | CHAT | FORUM | SYSTEM
  - priority: LOW | MEDIUM | HIGH | URGENT
  - pagination: take (page size), skip (offset)

  Errors:
  - UNAUTHENTICATED  (no session)
  - INTERNAL_SERVER_ERROR
  """
  notifications(input: GetNotificationsInput): PaginatedNotificationsResponse!
}
```

#### 2.3 Mutations

These are driven by `NotificationService`.
They change the unread counters and fire subscription events.

```graphql
type Mutation {
  """
  Create a single notification for a user.
  Only admins can create notifications (see Keystone access rules).
  """
  createNotification(input: CreateNotificationInput!): Notification

  """
  Create multiple notifications in a batch.
  Only admins can create notifications.
  """
  createBulkNotifications(input: CreateBulkNotificationsInput!): [Notification!]!

  """
  Mark a single notification as read for the current user.
  """
  markAsRead(notificationsId: ID!) Notification!

  """
  Mark all notifications as read for the current user.
  Returns number of notifications updated.
  """
  markAllAsRead: Int!

  """
  Delete a notification.
  Only admins can delete notifications.
  """
  deleteNotification(notificationId: ID!) Boolean!
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

#### 2.4 Subscriptions (Current)

From `NotificationService`:

- On create:
  - `UNREAD_COUNT_CHANGED` with `{ userId, count }`
  - `NOTIFICATION_CREATED` with notification payload
- On markAsRead / markAllAsRead:
  - `UNREAD_COUNT_CHANGED` with `{ userId, count }`

GraphQL layer:

```graphql
type UnreadCountChanged {
  count: Int!
}

type NotificationCreated {
  userId: ID!
  notificationId: ID!
  type: String!
  notificationType: NotificationType!
  priority: NotificationPriority!
  content: String!
  actionUrl: String
  metadata: JSON
  createdAt: DateTime!
}

type Subcription {
  """
  Emits whenever the total unread count changes for the authenticated user.
  Triggered by :
  - createdNotification (increment)
  - markAsRead (decrement, if previously unread)
  - markAllAsRead (reset to 0)
  """
  unreadCountChanged: UnreadCountChanged!

  """
  Emits whenever a new notification is created for the authenticated user.
  """
  notificationCreated: NotificationCreated!
}
```

#### Runtime Notes

- Redis Hash per user:
  - Key = `unread:{userId}`
  - Fields = `total` + each `NotificationType` (`CARE_PLAN`, `CHAT`, `FORUM`, `SYSTEM`)
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

**Sample response**

```json
{
  "data": {
    "unreadCount": { "count": 5, "notificationType": "CHAT" }
  }
}
```

### Paginated notifications (filterable)

**Operation**

```graphql
query GetNotifications($input: GetNotificationsInput) {
  notifications(input: $input) {
    notifications {
      id
      type
      notificationType
      priority
      content
      actionUrl
      metadata
      read
      readAt
      createdAt
    }
    total
    hasMore
    skip
    take
  }
}
```

**Variables (examples)**

**_All unread, any type (page 1):_**

```json
{ "input": { "read": false, "take": 20, "skip": 0 } }
```

**_Unread of a specific type, high priority:_**

```json
{
  "input": {
    "read": false,
    "notificationType": "CHAT",
    "priority": "HIGH",
    "take": 10,
    "skip": 0
  }
}
```

**Sample response**

```json
{
  "data": {
    "notifications": {
      "notifications": [
        {
          "id": "notif_123",
          "type": "NEW_MESSAGE",
          "notificationType": "CHAT",
          "priority": "HIGH",
          "content": "You have a new message",
          "actionUrl": "/chats/abc",
          "metadata": {},
          "read": false,
          "readAt": null,
          "createdAt": "2025-11-12T18:05:31.102Z"
        }
      ],
      "total": 42,
      "hasMore": true,
      "skip": 0,
      "take": 10
    }
  }
}
```

### Current - Subscription you can use right now

> The backend publishes an internal `UNREAD_COUNT_CHANGED` with `{ userId, count }`. The GraphQL subscription exposes a simplified payload for the authenticated user.

**Operation**

```graphql
subscription OnUnreadCountChanged {
  unreadCountChanged {
    count
  }
}
```

**Sample event**

```json
{
  "data": { "unreadCountChanged": { "count": 18 } }
}
```

When does this fire?

- After `createNotification` (increments)
- After `markAsRead` (decrements, if previously unread)
- After `markAllAsRead` (resets to 0)

### Future target - Coming from "Real-time counter updates" subtask

> Keep in docs to know what to migrate in the FrontEnd. Not live updates.

#### Aggregated unread counts

**Operation**

```graphql
query GetUnreadCounts($input: UnreadCountsInput) {
  unreadCounts(input: $input) {
    total
    asOf
    byScope {
      scope
      count
    }
  }
}
```

**Variables**

```json
{ "input": { "scopes": ["GLOBAL", "CHAT", "FORUM"] } }
```

**Sample response**

```json
{
  "data": {
    "unreadCounts": {
      "total": 17,
      "asOf": "2025-11-12T18:21:40.192Z",
      "byScope": [
        { "scope": "GLOBAL", "count": 17 },
        { "scope": "CHAT", "count": 5 },
        { "scope": "FORUM", "count": 3 }
      ]
    }
  }
}
```

#### Rich live updates (snapshot or delta)

**Operation**

```graphql
subscription OnUnreadCountChange($input: UnreadCountsInput) {
  unreadCountChange(input: $input) {
    asOf
    total
    byScope {
      scope
      count
    } # present when server sends full snapshot
    delta {
      scope
      id
      count
    } # present when server sends delta
  }
}
```

**Variables**

```json
{ "input": { "scopes": ["GLOBAL", "CHAT"] } }
```

**Sample events**

**_Snapshot variant:_**

```json
{
  "data": {
    "unreadCountChange": {
      "asOf": "2025-11-12T18:22:95.012Z",
      "total": 18,
      "byScope": [
        { "scope": "GLOBAL", "count": 18 },
        { "scope": "CHAT", "count": 6 }
      ],
      "delta": null
    }
  }
}
```

**_Delta variant:_**

```json
{
  "data": {
    "unreadCountChange": {
      "asOf": "2025-11-12T18:22:10.441Z",
      "total": 17,
      "byScope": null,
      "delta": [{ "scope": "CHAT", "count": 5 }]
    }
  }
}
```

## 4. Integration Notes (for FrontEnd)

This section explains exactly how the fronteld should call the API and how it will migrate once "Real-time counter updates" lands. It also covers error handling and resiliency.

### 4.1 Minimal client flow

#### Current version

1. Initial fetch (total only or per type)

- Call `unreadCount()` for total, or `unreadCount(notificationType: ...)` for a specific category.

2. Subscribe to total changes

- Start `unreadCountChanged` and update the total badge when events arrive.

3. Notification list

- Use `notifications(input)` with filters for the inbox UI.

> Note: Current version emits **only total** on the subscription. If you show per-type badges, refetch those types on certain UI actions (e.g., after marking read).

#### Target

1. **Initial fetch (aggregate)**

- Call `unreadCounts(input: { scopes: [...] })` to get `total` + `byScope`.

2. **Live updates (aggregate)**

- Start `unreadCountChange(input: sameScopes)` and either replace snapshot or apply deltas.

3. Consistency

- Use `asOf` to drop stale events.

---

### 4.2 Error model & recommended handling

All resolvers may throw GraphQL errors with `extensions.code`:

- `UNAUTHENTICATED` - no session / expired token
  -> redirect to login; stop subscriptions
- `BAD_USER_INPUT` - invalid args
  -> fix variables; show inline error if user-provided
- `CACHE_MISS` - Redis hasn't been seeded yet for this user
  -> treat as zero; optionally refetch after a short delay
- `NOT_FOUND` - resource missing
  -> show empty state
- `INTERNAL_SERVER_ERROR` - server error
  -> keep previous counts; retry with backoff

**Suggested policy**

- Keep the **last known count** in cache; never flash to 0 on transient errors.
- Retry queries with exponential backoff (e.g., 1s -> 2s -> 4s -> max 30s).
- If the WebSocket drops, **fallback to polling** until reconnected (30-60s cadence).

---

### 4.3 Apollo usage snippets

#### Current - total unread (query + sub)

```ts
import { gql, useQuery } from '@apollo/client';

// Query
export const Q_UNREAD_TOTAL = gql`
  query UnreadTotal {
    unreadCount {
      count
    }
  }
`;

// Subscription (total only)
export const S_UNREAD_TOTAL = gql`
  subscription OnUnreadCountChanged {
    unreadCountChanged {
      count
    }
  }
`;

// Hook
export function useUnreadTotal() {
  const q = useQuery(Q_UNREAD_TOTAL, { fetchPolicy: 'cache-and-network' });
  return q;
}
```

Subscription setup (somewhere near app boot / session ready):

```ts
client.subscribe({ query: S_UNREAD_TOTAL }).subscribe({
  next: ({ data }) => {
    const count = data?.unreadCountChanged?.count ?? null;
    if (count == null) return;

    client.writeQuery({
      query: Q_UNREAD_TOTAL,
      data: { unreadCount: { __typename: 'UnreadCount', count } },
    });
  },
  error: (e) => {
    /* optional: enable polling fallback */
  },
});
```

#### Aggregate unread (target)

```ts
export const Q_UNREAD_COUNTS = gql`
  query GetUnreadCounts($input: UnreadCountsInput) {
    unreadCounts(input: $input) {
      total
      asOf
      byScope { scope count }
    }
  }
`;

export const S_UNREAD_COUNTS = gql`
  subscription OnUnreadCountChange($input: UnreadCountsInput) {
    unreadCountChange(input: $input) {
      asOf
      total
      byScope { scope count }
      delta { scope id count }
    }
  }
`;

// Merge logic
function applyEvent(existing: any, change: any) {
  if (!existing?.unreadCounts) return change.byScope ? change : { ...change, byScope: [] };
  if (new Date(change.asOf) < new Date(existing.unreadCounts.asOf)) return existing unreadCounts;

  if (Array.isArray(cange.byScope) && change.byScope.length) {
    return { total: change.total, asOf: change.asOf, byScope: change.byScope };
  }
  const map = new Map(existing.unreadCounts.byScope.map((x: any) => [x.scope, xcount]));
  (change.delta || []).forEach((d: any) => map.set(d.scope, d.count));
  return { total: change.total, asOf: change.asOf, byScope: [...map].map(([scope, count]) => ({ scope, count })) };
}
```

## 5. Badge Display – FrontEnd Best Practices

<!-- UX guidance for showing counts -->

## 6. Acceptance Criteria

<!-- checklist for QA and teammates -->

## 7. Redis Caching & PubSub

<!-- how counts are stored/published for real-time updates -->
