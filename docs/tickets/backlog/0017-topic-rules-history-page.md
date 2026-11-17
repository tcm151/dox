# Ticket 0017: Topic Rules Revision History

## Status
- State: Planned
- Priority: Low
- Next: Define the revision record, including the editor and timestamp for each rules or summary change

## Goal
Provide an auditable, user-visible revision history for topic rules and summary changes. Current rules and summary editing and display are covered by topic governance work; this ticket covers their history.

## Requirements
- [x] Topics store editable current rules and expose them alongside the topic summary.
- [ ] Rules and summary changes are versioned with timestamps and the editor's identity.
- [ ] Users can review current rules and recent revisions.

## Tasks
- [x] Store, edit, and display the current topic rules and summary.
- [ ] Define revision storage, retention, and visibility behavior.
- [ ] Add API support and topic UI for listing revisions.
- [ ] Add authorization and history tests.

## Notes
- The current optional rules field and its profile editor/topic-page display are implemented with Ticket 0007. Only revision history remains in scope here.

## Relevant Files
- app/pages/topic/[topic]/index.vue
- app/pages/topic/[topic]/profile.vue
- server/api/topic/[topic]/index.ts
- server/api/topic/[topic]/update.ts

## Progress Log
- 2026-11-12: Narrowed the remaining scope to revision history; current rules editing and display are implemented under Ticket 0007.
- 2026-04-13: Ticket created.