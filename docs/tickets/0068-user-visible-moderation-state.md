# Ticket 0068: Show User-Visible Moderation State

## Status
- State: Planned
- Priority: Medium
- Next: Inventory moderation states and affected-user surfaces

## Dependencies
- [0018](backlog/0018-thread-comment-lock-slowmode.md): Locked and slow-mode states must be available to display.
- [0033](backlog/0033-moderation-appeals-mvp.md): Appeal status and resolution notes must be available to display.

## Goal
Make relevant moderation outcomes understandable to affected users without exposing private moderator information.

## Requirements
- [ ] Affected users can see relevant locked-content state and action context.
- [ ] Affected users can see their appeal status and resolution when available.
- [ ] Private moderator notes and internal-only details are not exposed to users.

## Tasks
- [ ] Define which moderation states and action details are safe to show to each audience.
- [ ] Add user-facing state and appeal indicators to affected content surfaces.
- [ ] Test visibility and authorization for affected users and other viewers.

## Notes
- Coordinate wording and state transitions with the appeal and conversation-control tickets.

## Relevant Files
- app/pages/thread/[id].vue
- app/pages/post/components/CommentSection.vue
- app/pages/topic/[topic]/reports.vue

## Progress Log
- 2026-10-25: Ticket created.