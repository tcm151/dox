# Ticket 0067: Complete Or Hide Unfinished Moderation And Messaging UI

## Status
- State: Planned
- Priority: Medium
- Next: Inventory unfinished controls and dead-end flows on moderation and messaging surfaces

## Goal
Ensure moderation and messaging screens expose only complete, usable workflows before production.

## Requirements
- [ ] Unfinished moderation and messaging controls are completed or hidden.
- [ ] Visible actions have working, authorized outcomes and clear failure feedback.
- [ ] Moderation and messaging surfaces contain no dead-end controls or placeholder actions.

## Tasks
- [ ] Audit moderator, report, and inbox surfaces for unfinished workflows.
- [ ] Complete supported flows or hide controls that are not ready.
- [ ] Verify visible actions and error handling on each affected surface.

## Notes
- This ticket covers workflow completeness; consistent empty, loading, and error states are tracked in Ticket 0069.

## Relevant Files
- app/pages/moderator.vue
- app/pages/topic/[topic]/reports.vue
- app/pages/inbox.vue

## Progress Log
- 2026-10-25: Ticket created.