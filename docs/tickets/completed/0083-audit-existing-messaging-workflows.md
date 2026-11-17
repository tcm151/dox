# Ticket 0083: Audit Existing Messaging Workflows

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Bring the existing inbox and notification workflows to a consistent, verified state without expanding into new messaging features or delivery channels.

## Requirements
- [x] Existing inbox, notification, and reply-notification flows and their state transitions are documented.
- [x] Notification preferences, recipient authorization, unread state, and dismissal behavior work consistently.
- [x] Notification links navigate to the correct discussion and comment context.
- [x] Relevant workflows have focused server and browser coverage, including failure and empty states.

## Tasks
- [x] Inventory the inbox, notification APIs, notification creation, and user preference flows.
- [x] Audit individual and bulk dismissal, unread/viewed state, and notification navigation.
- [x] Verify thread and comment reply notifications respect recipient preferences.
- [x] Fix identified gaps and add focused tests without introducing new messaging features.

## Notes
- This ticket covers existing in-app messaging and notification behavior; real-time delivery and new delivery channels are out of scope.
- Ticket 0067 covers the immediate moderation and inbox UI completeness work.
- Notification preference controls and delivery gating are implemented in [Ticket 0008](0008-user-notification-preferences.md); this ticket verifies their interaction with existing workflows rather than rebuilding those controls.
- Blocked interactions remain enforced at their action routes; notification delivery is not separately filtered for blocked users.

## Audit Findings
### Existing behavior
- The inbox list is scoped to the authenticated recipient. `dismissed=false` selects unread notifications (`viewed=false`); `dismissed=true` includes both viewed and unread notifications. Results are ordered newest first, and `total` is computed before slicing to `amount`.
- The inbox starts with five results and increases `amount` to load more. The navigation badge requests `amount=0`; the handler uses a count-only query and returns an empty notification list for that request. Positive amounts still select all matching rows to compute `total` before slicing.
- Individual and bulk dismissal mark notifications as viewed without deleting them; bulk dismissal is scoped to the authenticated recipient. The single-item handler returns `404` for both missing and non-owned notifications.
- `NotificationManager` independently gates in-app notification creation and queued email using recipient preferences (defaults: in-app enabled, email disabled). It is used by comment replies, thread replies and quotes, awards, referrals, and moderation/report outcomes. Sends happen after their originating action transaction; template, query, or transaction failures are logged and do not turn an already committed action into a failed request.
- Thread reply and quote notifications use the created thread's ID as context. Comment-reply notifications use the created comment's ID, and `comment:id` contexts redirect to the comment anchor on post, link, and gallery discussions.
- Focused server tests cover list validation/filtering/order/limits, dismissal ownership and state, preference-gated comment and quote notifications, reply context, and logged notification failures. Browser tests cover inbox empty states, dismissal controls, and comment-notification navigation; link server tests cover comment routing.

## Relevant Files
- app/components/system/Navbar.client.vue
- app/pages/inbox.vue
- app/utils/freshness.ts
- app/pages/thread/[id].vue
- server/api/profile/notifications/index.ts
- server/api/profile/notifications/dismiss.ts
- server/api/profile/notifications/[id]/dismiss.ts
- server/api/profile/settings/index.ts
- server/api/profile/settings/update.ts
- server/api/comment/add.ts
- server/routes/comment/[id].ts
- server/utils/repos/NotificationManager.ts
- server/utils/repos/UserSettingsManager.ts
- shared/types/index.ts
- tests/parallel/account.browser.test.ts
- tests/parallel/links.server.test.ts
- tests/parallel/navigation.browser.test.ts
- tests/parallel/threads.server.test.ts
- tests/parallel/posts.server.test.ts
- tests/sequential/07-notifications.server.test.ts

## Progress Log
- 2026-11-16: Completed inbox validation, dismissal ownership, comment/quote preference and navigation coverage, count-only badge queries, and best-effort notification error handling. `yarn.cmd test --sequential` (23/23), `yarn.cmd test account.browser.test.ts` (17/17), `yarn.cmd test links.server.test.ts` (15/15), and `yarn.cmd typecheck` passed. `yarn.cmd test` had one parallel engagement transaction-conflict failure (149/150); `yarn.cmd test engagement.server.test.ts` passed (18/18).
- 2026-11-16: Moved to In Progress. Documented current inbox, preference, and navigation behavior and recorded the remaining verification and fixes.
- 2026-11-11: Ticket created.
