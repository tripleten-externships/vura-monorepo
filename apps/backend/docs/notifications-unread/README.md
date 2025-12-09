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

## 4. Badge Display Best Practices

This section defines **how the frontend should render notification badges** using the current GraphQL API:

- `customGetUnreadCount(notificationType?: NotificationType)`
- `customGetNotifications(input)`
- `unreadCountChanged(userId)`
- `notificationReceived(userId)`

The goal: **simple, predictable badges** that stay in sync with the MySQL-backed counters.

### 4.1 Source of truth for badge counts

- The **single source of truth** for unread badge counts is the **MySQL counter table**, exposed via:
  - `Query.customGetUnreadCount(notificationType?: NotificationType)`
  - `Subscription.unreadCountChanged(userId: ID!)`

- The frontend **SHOULD NOT** compute unread counts by manually filtering the notifications list as its primary mechanism. That can be used as a visual fallback (e.g. in an error state), but the badge should normally follow the counter.

### 4.2 Types of badges

The module supports several UX patterns:

1. **Global app-level badge (bell icon)**

- Shows the **total** unread count across all notification types.
- Driven by:
  - `customGetUnreadCount()` (no `notificationType`)
  - `unreadCountChanged(userId)` subscription

2. **Scoped / tab badges (per domain)**

- E.g. badges on "Chat", "Care Plans", "Forum" tabs.
- Each tab can query its own category:
  - `customGetUnreadCount(notificationType: CHAT)`
  - `customGetUnreadCount(notificationType: CARE_PLAN)`
  - etc.

3. **Row-level indicators inside a list**

- Individual notifications show read/unread state via:
  - `NotificationDetails.read` + styling (bold / dot / highlight).
- These do **not** use the counter table; they rely on `customGetNotifications`.

### 4.3 Recommended display rules

**Global badge (bell icon)**

- **Show a numeric badge** when `count > 0`.
- Hide the badge completely when `count = 0`.
- Cap visually at `"99+"` for large values:
  - 0 -> no badge
  - 1 -> `1`
  - 12 -> `12`
  - 120 -> `99+`

**Scoped (per-type) badges**

- Same rules as global:
  - `count > 0` -> show numeric badge (capped at `99+`)
  - `count = 0` -> hide badge.

**Row-level read/unread styling**

- Treat `notification.read === false` as **unseen**:
  - e.g. bold text, colored left border, unread dot, etc.
- Once `customMarkNotificationAsRead` returns the updated `NotificationDetails` (or the row is refreshed from `customGetNotifications`), drop the unread styling.

### 4.4 Lifecycle: how the Frontend should wire badges

#### 4.4.1 Initial load (global badge)

On app / layout mount:

1. Call:

```graphql
query GetTotalUnread {
  customGetUnreadCount {
    count
    notificationType
  }
}
```

2. Store `count` in the global state
3. Render the global badge from that value using the rules above.

#### 4.4.2 Live updates

Also on layout mount:

1. Subscribe to `unreadCountChanged` with the current user id:

```graphql
subscription OnUnreadCountChanged($userId: ID!) {
  unreadCountChanged(userId: $userId) {
    count
    notificationType
  }
}
```

2. For current version, `notificationType` will be `null` (total only).

Treat each event as:

- **"Authoritative new total"** -> overwrite the stored global count.
- Re-render badge.

3. Do **not** try to "increment/decrement manually" on the client in response to `notificationsReceived` / `markAsRead`. The server already updates teh counters and emits the latest value.

#### 4.4.3 Scoped badges (per-type)

For tab bar / navigation where you want per-type counts:

- Option A: **lazy fetch on tab hover / open**
  - When the user visits/opens a tab:
    - Call `customGetUnreadCount(notificationType: <TAB_TYPE>)`
    - Cache locally per tab type.
  - Good if you want to keep network traffic low.
- Option B: **eager fetch for all relevant types on layout mount**
  - Call `customGetUnreadCount(notificationType: CARE_PLAN)`, `CHAT`, `FORUM`, `SYSTEM` in parallel on layout mount and store the 4 numbers.
  - For now, `unreadCountChanged` only gives **total**, so per-type badges are refreshed by:
    - occasional refetch (e.g. when tab regains focus), or
    - on specific triggers (e.g. after you know a notification of that type was read).

> Future versions could add a richer "multi-type" unread payload; this doc sticks to current behavior.

### 4.5 Handling loading, errors, and auth

**Loading state**

- While `customGetUnreadCount` is loading:
  - Prefer showing **no badge** or a **skeleton dot**, not a `0` badge.
  - This avoids a flash of "0" that then jumps to a positive number.

**Error state**

- If `customGetUnreadCount` returns:
  - `UNAUTHENTICATED` -> treat as a sign-out; hide badges or redirect to login.
  - `INTERNAL_SERVER_ERROR` -> log to monitoring, and:
    - hide badge, or
    - show a disabled bell (no number) for a visual hint.

**Auth / tenancy**

- The backend enforces `context.session.data.id` in all custom resolvers.
- The frontend must **only subscribe with the current user's id**:

```graphql
unreadCountChanged(userId: CURRENT_USER_ID)
notificationReceived(userId: CURRENT_USER_ID)
```

- If the user switches accounts or logs out:
  - Clean up any active subscriptions
  - Reset badge counts to `0` or hide them.

### 4.6 Interaction patterns

**Marking as read from the list**

- When the user clicks an item to mark as read:
  - Call `custommarkNotificationAsRead(notificationId)`.
  - Optimistically update the row UI to `read = true` if you want.
  - Do **not** manually decrement the global badge count; wait for the `unreadCountChanged` subscription to deliver the updated total.

**"Mark all as read"**

- When the user hits "Mark all as read":
  - Call `customMarkAllNotificationsAsRead`.
  - Optionally, optimistically:
    - Clear unread styling from all visible rows.
    - Set the badge to `0` in your internal state.
  - The server will:
    - Bulk update notifications
    - Reset counters
    - Emit `unreadCountChanged(userId) { count: 0 }`.

### 4.7 Summary for frontend devs

- **Global badge** -> use `customGetUnreadCount()` + `unreadCountChanged`.
- **Per-type badge** -> use `customGetUnreadCount(notificationType: X)` on demand.
- **Never** treat the notification list as the primary counter.
- **Badges**:
  - Hide when `count = 0`
  - Show number, capped at `99+` when `count > 0`
  - Use subscription events as the authoritative value.
