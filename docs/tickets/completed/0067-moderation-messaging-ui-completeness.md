# Ticket 0067: Complete Or Hide Unfinished Moderation And Messaging UI

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Ensure moderation and messaging screens expose only complete, usable workflows before production.

## Requirements
- [x] Unfinished moderation and messaging controls are completed or hidden.
- [x] Visible actions have working, authorized outcomes and clear failure feedback.
- [x] Moderation and messaging surfaces contain no dead-end controls or placeholder actions.
- [x] Thread archive/unarchive is exposed to API-authorized roles or intentionally removed from the detail-page wiring.
- [x] Moderator tabs share consistent page framing and familiar result/filter controls.

## Tasks
- [x] Audit moderator, report, and inbox surfaces for unfinished workflows.
- [x] Align the moderator topic, report, and request tabs with admin page conventions for layout and result filters.
- [x] Audit the thread detail options and restore or intentionally remove its archive/unarchive control; align role visibility with the server guard.
- [x] Complete supported flows or hide controls that are not ready.
- [x] Verify visible actions and error handling on each affected surface.

## Notes
- This ticket covers workflow completeness; consistent empty, loading, and error states are tracked in Ticket 0069.
- Topic rename is outside this moderation and messaging UI scope; request and approval work is deferred in [Ticket 0084](../backlog/0084-topic-rename-requests.md), a focused sub-feature of Ticket 0007.
- Broader review of existing inbox and notification workflows is tracked in Ticket 0083.

## Relevant Files
- app/pages/moderator.vue
- app/pages/moderator/topics.vue
- app/pages/moderator/reports.vue
- app/pages/moderator/requests.vue
- app/pages/topic/[topic]/reports.vue
- app/pages/topic/[topic]/profile.vue
- app/pages/inbox.vue
- app/pages/thread/[id].vue
- app/pages/thread/components/ExtraOptions.vue
- app/components/lists/ReportQueue.vue
- app/components/lists/ReportQueueItem.vue
- app/utils/moderation.ts
- app/components/system/Reporter.client.vue
- server/routes/comment/[id].ts
- server/api/profile/notifications/index.ts
- server/api/profile/notifications/dismiss.ts
- server/api/thread/[id]/archive.ts
- tests/parallel/threads.server.test.ts

- server/api/topic/[topic]/profile.ts
- tests/parallel/topics.server.test.ts

## Progress Log
- 2026-11-12: Completed the immediate moderator, report, inbox, thread, and notification UI completeness scope. Topic rename remains deferred in Ticket 0084; broader existing-messaging workflow review remains in Ticket 0083.
- 2026-11-11: Paused pending the deferred topic rename workflow in Ticket 0084.
- 2026-11-11: Narrowed the dependency on topic governance to the rename workflow in Ticket 0084.
- 2026-11-11: Verified moderator request, report, topic-profile authorization, thread, and comment-redirect server flows with focused tests; corrected the comment lookup to pair `FROM` with `queryOne()`.
- 2026-11-11: Restricted the topic profile page to admins and assigned moderators via an authorized profile endpoint.
- 2026-11-11: Audited moderator and report actions, gated own-request actions, and surfaced report-action failures. The topic rename control remains a placeholder tracked in Ticket 0007.
- 2026-11-11: Added a comment redirect route to send comment notifications to their parent discussion and anchor.
- 2026-11-11: Reused bulk unread dismissal in the inbox and kept individual dismiss actions without per-item spinner state.
- 2026-11-10: Audited inbox and thread-detail actions, restored role-aligned archive/unarchive, added notification dismissal feedback, and added an archive transition test.
- 2026-11-10: Reviewed semantic markup across moderator, admin, and developer surfaces; converted result records to articles, empty states to sections, and click targets to native buttons.
- 2026-11-09: Standardized moderator tab framing and refresh controls, and added countable status filters for moderation requests.
- 2026-11-09: Added the hidden thread archive control to the moderation UI audit scope.
- 2026-10-25: Ticket created.