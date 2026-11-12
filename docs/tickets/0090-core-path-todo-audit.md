# Ticket 0090: Core Path TODO Audit

## Status
- State: Planned
- Priority: Low
- Next: Inventory high-visibility TODOs in feed, search, and settings paths

## Goal
Replace the open-ended roadmap TODO item with a bounded audit that identifies concrete trust-affecting gaps in core feed, search, and settings workflows.

## Requirements
- [ ] Relevant TODOs and unfinished states in the named core paths are inventoried.
- [ ] Each finding is triaged by user impact and either resolved in a focused change or recorded as a linked ticket.
- [ ] The roadmap references only actionable follow-up work after the audit.

## Tasks
- [ ] Inventory TODOs and unfinished behavior in feed, search, and settings paths.
- [ ] Verify which findings still apply and classify their user impact.
- [ ] Resolve small in-scope findings or create focused follow-up tickets.
- [ ] Update roadmap references and remove the audit item when complete.

## Notes
- Keep this audit time-boxed; it is not authorization for broad cleanup or unrelated refactoring.

## Relevant Files
- app/pages/feed.vue
- app/pages/feed/search.vue
- app/pages/settings/
- docs/Roadmap.md

## Progress Log
- 2026-11-12: Ticket created.