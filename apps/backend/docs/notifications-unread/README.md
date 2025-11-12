# 🔔 Notifications & Unread Counters API – Backend Documentation

## 1. Purpose & Scope

This document defines the backend GraphQL interface and runtime behavior for the Notifications domain and Unread Counters integration, so the frontend can reliably fethc, display, and subscribe to unread badge counts.

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

## 3. Playground Examples

<!-- include working queries/subscriptions and sample payloads -->

## 4. Integration Notes (for FE)

<!-- how the frontend should interact with it, including error codes and expected states -->

## 5. Badge Display – FE Best Practices

<!-- UX guidance for showing counts -->

## 6. Acceptance Criteria

<!-- checklist for QA and teammates -->

## 7. Redis Caching & PubSub

<!-- how counts are stored/published for real-time updates -->
