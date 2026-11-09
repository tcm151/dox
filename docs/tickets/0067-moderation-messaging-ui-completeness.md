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
- [ ] Thread archive/unarchive is exposed to API-authorized roles or intentionally removed from the detail-page wiring.

## Tasks
- [ ] Audit moderator, report, and inbox surfaces for unfinished workflows.
- [ ] Audit the thread detail options and restore or intentionally remove its archive/unarchive control; align role visibility with the server guard.
- [ ] Complete supported flows or hide controls that are not ready.
- [ ] Verify visible actions and error handling on each affected surface.

## Notes
- This ticket covers workflow completeness; consistent empty, loading, and error states are tracked in Ticket 0069.
- The thread detail handler and archive API exist, but the options-menu control is commented out. The API permits admins and developers; the disabled control checked only for admins.

## Relevant Files
- app/pages/moderator.vue
- app/pages/topic/[topic]/reports.vue
- app/pages/inbox.vue
- app/pages/thread/[id].vue
- app/pages/thread/components/ExtraOptions.vue
- server/api/thread/[id]/archive.ts

## Progress Log
- 2026-11-09: Added the hidden thread archive control to the moderation UI audit scope.
- 2026-10-25: Ticket created.