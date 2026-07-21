# Ticket 0005: Add Moderation Audit Log MVP

## Status
- State: Todo
- Priority: High
- Next action: Define minimum audit event schema

## Goal
Track core moderation actions with enough detail to support accountability and review.

## Done Looks Like
- [ ] Core moderation actions produce audit records.
- [ ] Audit records include actor, action, target, and timestamp.
- [ ] Basic moderator/admin audit view is available.

## Tasks
- [ ] Define audit event structure in shared/server contracts.
- [ ] Record events from key moderation write endpoints.
- [ ] Add a simple list view for recent audit events.

## Notes

## Relevant Files
- [app/pages/moderator.vue](../../app/pages/moderator.vue)
- [server/api/moderator/topics.ts](../../server/api/moderator/topics.ts)
- [server/api/topic/[topic]/reports.ts](../../server/api/topic/[topic]/reports.ts)
- [shared/utils/moderation.ts](../../shared/utils/moderation.ts)

## Progress Log
- 2026-04-13: Ticket created.


