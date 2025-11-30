# 🔔 Notifications & Unread Counters API – Backend Documentation

## 1. Purpose & Scope

This document defines the backend **GraphQL interface** and **runtime behavior** for the Notifications domain and Unread Counters, so the frontend can reliably:

- fetch paginated notifications
- fetch unread counts (total or by type)
- subscribe to real-time notification and unread count changes
- render consistent notification badges.

All behavior described here is based on the current `schema.graphql` and the `NotificationService` + `db-cache` implementation.

### 1.1 What this module does

At a high level, the Notifications module:

- **Persists notifications**
  - Keystone `Notification` list stores notification records.
  - Business logic lives in `NotificationService` and exposes a clean GraphQL facade via:
    - `customCreateNotification`
    - `customMarkNotificationAsRead`
    - `customMarkAllNotificationsAsRead`
    - `customGetNotifications`
    - `customGetUnreadCount`.

- **Exposes read APIs for the frontend**
  - `Query.customGetNotifications(input)`  
    → paginated, filterable notification list returning `NotificationDetails`.
  - `Query.customGetUnreadCount(notificationType?)`  
    → unread count for the current user, optionally filtered by `NotificationType`.

- **Maintains per-user unread counters in MySQL**
  - Uses a **database-backed “cache” table** via helper functions in `db-cache`:
    - `incrementCounter(prisma, userId, notificationType)`
    - `decrementCounter(prisma, userId, notificationType)`
    - `resetAllCounters(prisma, userId)`
    - `getTotalUnreadCount(prisma, userId)`
    - `getUnreadCountByType(prisma, userId, type)`
  - This avoids Redis entirely and keeps counters strongly consistent with the DB.

- **Emits Pub/Sub events for real-time updates**
  - `Subscription.notificationReceived(userId)`  
    -> fires on new notifications created for that user.
  - `Subscription.unreadCountChanged(userId)`  
    -> fires whenever the unread count for that user changes
    (create, mark single as read, mark all as read).

### 1.2 How the frontend should use it (current)

For the integration prep, the frontent should treat these as the primary surfaces:

-- **Queries**

- `customGetUnreadCount(notificationType?: NotificationType)`
  - `notificationType` omitted → total unread across all types.
  - `notificationType` provided → unread count for that specific category only.
- `customGetNotifications(input: GetNotificationsInput)`
  - Filtering by `read`, `notificationType`, `priority`.
  - Pagination via `take` (1–50) and `skip` (0–200).
  - Returns `NotificationsResult` with `notifications: [NotificationDetails!]!`.

- **Mutations**
  - `customCreateNotification(input: CreateNotificationInput!)`
  - `customMarkNotificationAsRead(notificationId: ID!)`
  - `customMarkAllNotificationsAsRead`

  These call into `NotificationService`, update the MySQL counters via `db-cache`,
  and then publish subscription events.

- **Subscriptions**
  - `notificationReceived(userId: ID!) : NotificationDetails!`  
    -> subscribe to new notifications for the current user.
  - `unreadCountChanged(userId: ID!) : UnreadCountResult!`  
    -> subscribe to updated unread counts for the current user.

> Frontend consumers should **prefer these custom fields** over Keystone’s raw `Notification` list queries/mutations.

### 1.3 Out of scope (handled by sister subtasks)

This document assumes the following are handled by separate stories/subtasks:

- **Efficient Counter Queries**
  - Physical table design and indexing for the counters table.
  - Query plans and performance tuning of `db-cache` helpers.
  - Any future richer unread API (e.g. returning breakdowns in a single call).

- **Real-time Counter Updates**
  - Low-level Pub/Sub wiring and event fan-out.
  - Ensuring ordering and idempotency of `unreadCountChanged` events.
  - Any advanced payload design

This spec only describes **how those capabilities are exposed to the frontend**, not how they
are implemented internally.

### 1.4 Error signaling

Notification queries/mutations use `GraphQLError` with `extensions.code` to signal errors.

Common codes used by this module:

- `UNAUTHENTICATED`
  - No `context.session.data.id` present.
  - Frontend should treat this as “user logged out / token expired”.

- `BAD_USER_INPUT`
  - Validation failures (e.g. missing userId, invalid notificationType).
  - Typically thrown inside `NotificationService`.

- `NOT_FOUND`
  - A specific notification cannot be found (e.g. for `customMarkNotificationAsRead`).

- `INTERNAL_SERVER_ERROR`
  - Any unexpected error during DB operations, counter updates, or Pub/Sub.

> If a row doesn't exist yet, helpers must treat that as `0`.

### 1.5 Security / tenancy

Multi-tenant behavior is enforced at two layers:

- **Keystone list access (Notification list)**
  - `query` access:
    - Admins can see all notifications.
    - Regular users can only see notifications where `notification.userId = session.data.id`.
  - `create`:
    - Restricted to admins (or system).
  - `update`:
    - Users can only update their own notifications; admins can update any.
  - `delete`:
    - Restricted to admins.

- **Custom resolvers**
  - All custom queries/mutations (`customGetNotifications`, `customGetUnreadCount`,
    `customCreateNotification`, `customMarkNotificationAsRead`, `customMarkAllNotificationsAsRead`)
    enforce that an authenticated session exists (`context.session.data.id`).
  - Unread counters in `db-cache` are always keyed by the **current user id**,
    not by arbitrary IDs supplied by the client.
  - Subscriptions `notificationReceived(userId)` and `unreadCountChanged(userId)` use
    the `userId` argument to route events, but the server is responsible for ensuring
    that a client cannot subscribe to another user’s stream (enforced at resolver level).

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
"""
Result shape for querying unread counts (optionally filter by type).
"""
type UnreadCountResult {
  count: Int!
  """
  Present when the request was filtered by a specific NotificationType.
  Null when the query requested the global total.
  """
  notificationType: NotificationType
}
```

> There is also the Keystone list type `Notification` (with string fields for `notificationType` / `priority`). For the frontend, always use `NotificationDetails` via the custom resolvers instead of the raw list.

#### 2.2 Inputs

```graphql
"""
Input for creating a single notification.
Used by Mutation.customCreateNotification.
"""
input CreateNotificationInput {
  userId: userId_ID_NotNull_minLength_1!
  type: type_String_NotNull_maxLength_50!
  notificationType: NotificationType!
  priority: NotificationPriority
  content: content_String_NotNull_minLength_1_maxLength_500!
  actionUrl: actionUrl_String_format_uri
  metadata: JSON
  relatedCarePlanId: relatedCarePlanId_ID_minLength_1
  relatedChatId: relatedChatId_ID_minLength_1
  relatedForumPostId: relatedForumPostId_ID_minLength_1
}

"""
Input for fetching notifications with filters and pagination.
Used by Query.customGetNotifications.
"""
input GetNotificationsInput {
  read: Boolean
  notificationType: NotificationType
  priority: NotificationPriority
  take: take_Int_min_1_max_50
  skip: skip_Int_min_0_max_200
}
```

#### 2.3 Queries (custom notifcation endpoints)

Custom queries exposed for notification consumption:

```graphql
type Query {
  """
  Returns paginated notifications for the authenticated user.

  Filters:
  - read: filter by read/unread
  - notificationType: CARE_PLAN | CHAT | FORUM | SYSTEM
  - priority: LOW | MEDIUM | HIGH | URGENT
  - pagination: take (page size, 1–50), skip (offset, 0–200)

  Return:
  - notifications: array of NotificationDetails
  - total: total results for given filters
  - hasMore: (skip + take) < total
  - skip, take: echo of input (for client-side pagination logic)

  Errors:
  - UNAUTHENTICATED                 (no session in context)
  - INTERNAL_SERVER_ERROR           (unexpected server error)
  """
  customGetNotifications(input: GetNotificationsInput): NotificationsResult!

  """
  Returns unread count(s) for the authenticated user.

  If `notificationType` is provided:
    - returns count of unread notifications for that category only
    - response.notificationType is set to that enum value

  If `notificationType` is omitted:
    - returns total unread across all categories
    - response.notificationType is null

  Errors:
  - UNAUTHENTICATED
  - INTERNAL_SERVER_ERROR
  """
  customGetUnreadCount(notificationType: NotificationType): UnreadCountResult!
}
```

#### 2.4 Mutations (custom notification endpoints)

Backed by `NotificationService` **plus** the db-cache helpers (`incrementCounter`, `decrementCounter`, `resetAllCounters`) and PubSub.

```graphql
type Mutation {
  """
  Create a notification for a specific user.

  Access control:
  - Only admins (or system code) can create notifications (see Keystone access rules).

  Side effects:
  - Persists the notification.
  - Increment unread counters in the MySQL cache table.
  - Publishes:
    - unreadCountChanged(userId) with updated UnreadCountResult
    - notificationReceived(userId) with NotificationDetails
  """
  customCreateNotification(input: CreateNotificationInput!): CreateNotificationResult!

  """
  Mark a single notification as read for the current authenticated user.

  Side effects:
  - Marks notification.read = true (if it belongs to the user).
  - Decrements unread counters in the MySQL cache (if previously unread).
  - Publishes unreadCountChanged(userId) with updated UnreadCountResult.
  """
  customMarkNotificationAsRead(notificationId: ID!): MarkAsReadResult!

  """
  Mark all notifications as read for the current authenticated user.

  Return:
  - count: number of updated notifications.

  Side effects:
  - Bulk set read = true for all unread notifications for that user.
  - Resets all counters to 0 in the MySQL cache.
  - Publishes unreadCountChanged(userId) with count = 0.
  """
  customMarkAllNotificationsAsRead: MarkAllAsReadResult!
}

type CreateNotificationResult {
  notification: NotificationDetails!
  message: String!
}

type MarkAsReadResult {
  notification: NotificationDetails!
  message: String!
}

type MarkAllAsReadResult {
  count: Int!
  message: String!
}
```

#### 2.5 Subscriptions

Based on the schema:

```graphql
type Subscription {
  """
  Emits whenever a new notification is created for the given userId.

  Payload:
  - NotificationDetails for the new notification.
  """
  notificationReceived(userId: ID!): NotificationDetails!

  """
  Emits whenever the unread count for the given userId changes.

  Triggered by:
  - customCreateNotification (increment)
  - customMarkNotificationAsRead (decrement, if previously unread)
  - customMarkAllNotificationsAsRead (reset to zero)

  Payload:
  - UnreadCountResult (currently total only; future versions may include more fields)
  """
  unreadCountChanged(userId: ID!): UnreadCountResult!

  # other subscriptions...
}
```

## 3. GraphQL Examples (Queries + Subscriptions)

### 3.1 Unread Count Queries

#### A. Total unread (no type filter)

```graphql
query GetTotalUnread {
  customGetUnreadCount {
    count
    notificationType
  }
}
```

**Expected response shape**

```json
{
  "data": {
    "customGetUnreadCount": {
      "count": 17,
      "notificationType": null
    }
  }
}
```

#### B. Unread by category

Example: unread **CHAT** notifications only.

```graphql
query GetUnreadChat {
  customGetUnreadCount(notificationType: CHAT) {
    count
    notificationType
  }
}
```

**Expected response**

```json
{
  "data": {
    "customGetUnreadCount": {
      "count": 3,
      "notificationType": "CHAT"
    }
  }
}
```

### 3.2 Notifications List Queries

#### A. Fetch latest notifications (default pagination)

```graphql
query FetchNotifications {
  customGetNotifications {
    notifications {
      id
      type
      notificationType
      content
      read
      createdAt
    }
    total
    hasMore
    skip
    take
  }
}
```

#### B. Filter unread only

```graphql
query FetchUnreadOnly {
  customGetNotifications(input: { read: false }) {
    notifications {
      id
      type
      notificationType
      content
      read
    }
    total
  }
}
```

#### C. Filter by notificationType + priority

Example: all unread **CHAT** notifications with **HIGH** priority.

```graphql
query FetchFiltered {
  customGetNotifications(input: { read: false, notificationType: CHAT, priority: HIGH }) {
    notifications {
      id
      content
      priority
      createdAt
    }
    total
  }
}
```

#### D. Pagination (infinite scroll)

Page 1 (first 20):

```graphql
query Page1 {
  customGetNotifications(input: { take: 20, skip: 0 }) {
    notifications {
      id
      createdAt
      content
    }
    total
    hasMore
  }
}
```

Page 2:

```graphql
query Page2 {
  customGetNotifications(input: { take: 20, skip: 20 }) {
    notifications {
      id
      createdAt
      content
    }
    total
    hasMore
  }
}
```

### 3.3 Subscriptions (Apollo)

#### A. `unreadCountChanged` subscription

This fires whenever:

- A new notification is created
- A notification is marked as read
- `markAllAsRead` resets counts.

```graphql
subscription OnUnreadCountChanged($userId: ID!) {
  unreadCountChanged(userId: $userId) {
    count
    notificationType
  }
}
```

**Variables**

```json
{
  "userId": "USER123"
}
```

**Expected event payload**

```json
{
  "data": {
    "unreadCountChanged": {
      "count": 6,
      "notificationType": null
    }
  }
}
```

> `notificationType` is **always null** for now because the subscription only emits **total** counts.

#### B. `notificationReceived` subscription

Fires when a new notification is created for the user.

```graphql
subscription OnNotificationReceived($userId: ID!) {
  notificationReceived(userId: $userId) {
    id
    type
    notificationType
    content
    priority
    read
    createdAt
  }
}
```

**Variables**

```json
{
  "userId": "USER123"
}
```

**Expected event payload**

```json
{
  "data": {
    "notificationReceived": {
      "id": "abc123",
      "type": "NEW_MESSAGE",
      "notificationType": "CHAT",
      "content": "You have a new message",
      "priority": "MEDIUM",
      "read": false,
      "createdAt": "2025-01-01T12:00:00.000Z"
    }
  }
}
```

### 3.4 Full Example Workflow (End-to-End)

What the Frontend will do:

**Step 1 (initial fetch):**

```graphql
query {
  customGetUnreadCount {
    count
  }
}
```

**Step 2 (listen for live changes):**

```graphql
subscription ($userId: ID!) {
  unreadCountChanged(userId: $userId) {
    count
  }
}
```

**Step 3 (fetch notifications list):**

```graphql
query {
  customGetNotifications(input: { read: false }) {
    notifications {
      id
      content
      read
    }
  }
}
```

**Step 4 (user marks as read):**

```graphql
mutation {
  customMarkNotificationsAsAread(notificationId: "abc123") {
    notification {
      id
      read
    }
    message
  }
}
```

**Frontend receives:**

- Updated unread count via subscription.
- Updated `read` status in notifications list.

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
