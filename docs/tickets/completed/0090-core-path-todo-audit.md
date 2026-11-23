# Ticket 0090: Core Path TODO Audit

## Status
- State: Completed
- Priority: Low
- Next: None

## Goal
Replace the open-ended roadmap TODO item with a bounded audit that identifies concrete trust-affecting gaps in core feed, search, and settings workflows.

## Requirements
- [x] Relevant TODOs and unfinished states in the named core paths are inventoried.
- [x] Each finding is triaged by user impact and either resolved in a focused change or recorded as a linked ticket.
- [x] The roadmap references only actionable follow-up work after the audit.

## Tasks
- [x] Inventory TODOs and unfinished behavior in feed, search, and settings paths.
- [x] Verify which findings still apply and classify their user impact.
- [x] Resolve small in-scope findings or create focused follow-up tickets.
- [x] Update roadmap references and remove the audit item when complete.

## Notes
- Keep this audit time-boxed; it is not authorization for broad cleanup or unrelated refactoring.
- No TODO/FIXME markers or unfinished feed/search behavior were found. The settings audit found that emailed reset links target a page blocked by its parent authentication guard, and the page's Cancel button is inert; both are tracked in Ticket 0140.

## Relevant Files
- app/pages/feed.vue
- app/pages/feed/search.vue
- app/pages/settings.vue
- app/pages/settings/
- docs/Roadmap.md
- server/api/profile/password/reset.ts

## Progress Log
- 2026-11-19: Audited feed, search, and settings paths. Found no remaining explicit TODO markers; recorded the high-impact password-reset access and cancellation defects in [0140](../0140-restore-password-reset-flow.md) and updated the roadmap.
- 2026-11-12: Ticket created.