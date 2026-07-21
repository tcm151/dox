# Ticket 0018: Thread/Comment Lock And Slow Mode

## Status
- State: Todo
- Priority: High
- Next action: Define lock and slow-mode state fields for thread/comment surfaces

## Goal
Give moderators targeted controls to reduce escalation and spam during active moderation.

## Done Looks Like
- [ ] Moderators can lock threads/comments where supported.
- [ ] Slow mode enforcement limits posting frequency as configured.
- [ ] UI indicates locked/slow-mode states clearly.

## Tasks
- [ ] Define state fields and constraints in contracts/schema.
- [ ] Enforce checks in write endpoints.
- [ ] Add moderator controls in relevant UI surfaces.

## Notes

## Relevant Files
- app/pages/thread/[id].vue
- app/pages/post/components/CommentSection.vue
- server/api/thread/[id]/archive.ts
- server/api/comment/add.ts
- shared/types/index.ts

## Progress Log
- 2026-04-13: Ticket created.


