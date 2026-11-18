# Ticket 0097: Realtime Notification Delivery

## Status
- State: Planned
- Priority: Low
- Next: Confirm polling is stable and choose the realtime transport and reconnect contract

## Dependencies
- [0083](../completed/0083-audit-existing-messaging-workflows.md): Realtime delivery must preserve the audited notification authorization and state behavior.
- [0060](../completed/0060-feed-inbox-freshness.md): Realtime delivery is optional and must build on a stable polling fallback.
- [0112](../completed/0112-bound-discovery-and-inbox-queries.md): Reconnect and polling fallback must use bounded inbox reads rather than replaying an unbounded notification history.

## Goal
Add optional realtime in-app notification delivery after existing messaging workflows are audited and the polling baseline is reliable.

## Requirements
- [ ] The transport and deployment requirements are documented for supported hosting modes.
- [ ] Authenticated connections receive notification updates only for the current user.
- [ ] Reconnects, duplicate delivery, unread state, dismissal, and polling fallback remain consistent.
- [ ] Users can retain polling behavior without enabling or maintaining a realtime connection.
- [ ] Connection lifetime, resource bounds, authorization, and failure behavior have focused coverage.

## Tasks
- [ ] Select SSE or WebSocket based on deployment and client requirements.
- [ ] Define authentication, reconnect, event identity, and polling fallback behavior.
- [ ] Implement the server delivery endpoint and client subscription lifecycle.
- [ ] Keep notification read/dismiss state authoritative across realtime and polling paths.
- [ ] Test authorization, disconnect/reconnect, duplicate events, fallback, and resource limits.

## Notes
- This is a deferred enhancement, not a prerequisite for the baseline inbox experience.
- Keep the connection scoped to in-app notifications; email delivery is handled separately.

## Relevant Files
- app/pages/inbox.vue
- server/api/profile/notifications/
- server/utils/repos/NotificationManager.ts
- server/middleware/protection.ts
- tests/parallel/

## Progress Log
- 2026-11-17: Added bounded inbox reads as a prerequisite for reconnect/polling behavior; realtime delivery remains deferred.
- 2026-11-12: Ticket created.