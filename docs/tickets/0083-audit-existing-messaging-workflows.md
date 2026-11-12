# Ticket 0083: Audit Existing Messaging Workflows

## Status
- State: Planned
- Priority: Medium
- Next: Inventory existing inbox, notification, and reply-notification workflows

## Goal
Bring the existing inbox and notification workflows to a consistent, verified state without expanding into new messaging features or delivery channels.

## Requirements
- [ ] Existing inbox, notification, and reply-notification flows and their state transitions are documented.
- [ ] Notification preferences, recipient authorization, unread state, and dismissal behavior work consistently.
- [ ] Notification links navigate to the correct discussion and comment context.
- [ ] Relevant workflows have focused server and browser coverage, including failure and empty states.

## Tasks
- [ ] Inventory the inbox, notification APIs, notification creation, and user preference flows.
- [ ] Audit individual and bulk dismissal, unread/viewed state, and notification navigation.
- [ ] Verify thread and comment reply notifications respect recipient preferences.
- [ ] Fix identified gaps and add focused tests without introducing new messaging features.

## Notes
- This ticket covers existing in-app messaging and notification behavior; real-time delivery and new delivery channels are out of scope.
- Ticket 0067 covers the immediate moderation and inbox UI completeness work.
- Notification preference controls and delivery gating are implemented in [Ticket 0008](completed/0008-user-notification-preferences.md); this ticket verifies their interaction with existing workflows rather than rebuilding those controls.

## Relevant Files
- app/pages/inbox.vue
- app/pages/thread/[id].vue
- server/api/profile/notifications/index.ts
- server/api/profile/notifications/dismiss.ts
- server/routes/comment/[id].ts
- server/utils/repos/NotificationManager.ts
- tests/parallel/threads.server.test.ts
- tests/parallel/posts.server.test.ts

## Progress Log
- 2026-11-11: Ticket created.
