# Ticket 0033: Moderation Appeals Workflow MVP

## Status
- State: Todo
- Priority: High
- Next action: Define appeal states and first-pass moderator actions

## Goal
Add a basic appeals workflow so moderated users can request review and moderators can resolve appeals with status tracking.

## Done Looks Like
- [ ] Users can submit appeals on moderated actions/content.
- [ ] Moderators can view and transition appeal statuses.
- [ ] Appeal history is visible with timestamps and resolution notes.

## Tasks
- [ ] Define appeal model and state transitions.
- [ ] Implement appeal create/list/update API handlers.
- [ ] Build moderator UI for appeal triage and resolution.

## Notes
- Keep initial process simple and auditable.

## Relevant Files
- [app/pages/moderator.vue](../../app/pages/moderator.vue)
- [app/pages/topic/[topic]/reports.vue](../../app/pages/topic/[topic]/reports.vue)
- [server/api/topic/[topic]/reports.ts](../../server/api/topic/[topic]/reports.ts)
- [server/api/report/send.ts](../../server/api/report/send.ts)
- [shared/types/index.ts](../../shared/types/index.ts)

## Progress Log
- 2026-04-13: Ticket created.
