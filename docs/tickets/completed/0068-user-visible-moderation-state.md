# Ticket 0068: Show User-Visible Moderation State

## Status
- State: Completed
- Priority: Medium
- Next: None

## Dependencies
- [0018](0018-thread-comment-lock-slowmode.md): Locked and slow-mode states must be available to display.
- [0033](0033-moderation-appeals-mvp.md): Appeal status and resolution notes must be available to display.

## Goal
Make relevant moderation outcomes understandable to affected users without exposing private moderator information.

## Requirements
- [x] Locked and quarantined content has a clear user-visible state on affected content surfaces.
- [x] Content owners can reach existing appeal context and see appeal status and resolution when available.
- [x] Moderator-only controls and notes are not shown in public or owner-facing UI.

## Tasks
- [x] Audit existing lock, quarantine, and appeal state presentation and owner visibility.
- [x] Add a Removed indicator to shared headers for quarantined content without changing direct-access behavior.
- [x] Add browser coverage for quarantined content state and verify with a focused browser test and typecheck.

## Notes
- Quarantined content remains directly accessible by URL; the selected behavior is to show its state without hiding its body.
- Removal and appeal decision context remain on the owner-only appeal page, reachable from inbox notifications.
- Report history has no separate private-note field; the owner appeal view renders removal and appeal decision context only.

## Relevant Files
- app/components/system/ContentHeader.vue
- app/components/system/ModerationState.vue
- app/components/system/previews/CommentPreview.vue
- app/pages/appeal/[id].vue
- app/pages/inbox.vue
- server/api/profile/appeals/[id].ts
- server/utils/ReportManager.ts
- tests/parallel/thread.browser.test.ts
- tests/parallel/reports.server.test.ts

## Progress Log
- 2026-11-11: Added a Removed indicator for quarantined content and a focused thread browser check; preserved direct-link visibility. Existing owner-scoped appeal details were confirmed.
- 2026-10-25: Ticket created.