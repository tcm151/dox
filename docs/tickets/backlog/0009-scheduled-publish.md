# Ticket 0009: Add Scheduled Publish Support

## Status
- State: Todo
- Priority: Medium
- Next action: Choose scheduling execution model (polling job vs request-time release)

## Goal
Allow post/thread submissions to be scheduled for future publication.

## Done Looks Like
- [ ] Authors can set a future publish time.
- [ ] Scheduled items are not publicly visible before release time.
- [ ] Publish process is reliable across restarts.

## Tasks
- [ ] Define scheduled fields and states in contracts/schema.
- [ ] Implement scheduling and release logic server-side.
- [ ] Add editor UI controls for schedule date/time.

## Notes

## Relevant Files
- app/pages/editor/post.vue
- app/pages/editor/thread.vue
- server/api/post/add.ts
- server/api/thread/add.ts
- server/assets/schema.surql

## Progress Log
- 2026-04-13: Ticket created.


