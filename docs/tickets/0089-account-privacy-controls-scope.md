# Ticket 0089: Define Account Privacy Controls

## Status
- State: Planned
- Priority: Medium
- Next: Inventory account data and profile surfaces that need privacy decisions

## Goal
Define the first account-level privacy controls and their defaults before implementation, without conflating them with content tagging and visibility preferences.

## Requirements
- [ ] The initial privacy control set, audience behavior, and defaults are documented.
- [ ] The affected profile, content, and API surfaces are identified, including authorization expectations.
- [ ] Data-contract and migration implications are documented without introducing unapproved behavior.
- [ ] Follow-up implementation work is captured in focused tickets linked from the roadmap.

## Tasks
- [ ] Inventory account and profile information currently exposed to signed-in and public viewers.
- [ ] Propose privacy controls and defaults with explicit user-visible behavior.
- [ ] Document affected UI, APIs, contracts, and migration requirements.
- [ ] Create implementation tickets after the control set is agreed.

## Notes
- This is a scoping ticket; it does not change current visibility behavior.
- Content tags and user/community visibility modes are already covered by completed [Ticket 0016](completed/0016-content-visibility-controls.md).

## Relevant Files
- docs/Architecture.md
- app/pages/settings/preferences.vue
- app/pages/user/[id]/index.vue
- server/api/profile/
- shared/types/index.ts

## Progress Log
- 2026-11-12: Ticket created.