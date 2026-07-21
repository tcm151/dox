# Ticket 0020: Checkout Flow Feature Flag Foundation

## Status
- State: Todo
- Priority: Low
- Next action: Define feature flag name and default disabled behavior

## Goal
Prepare store checkout architecture behind a feature flag so monetization work can progress safely without exposing incomplete flows.

## Done Looks Like
- [ ] Checkout routes/actions are gated by a server-backed feature flag.
- [ ] Disabled state hides or replaces purchase controls cleanly.
- [ ] No accidental checkout path is reachable when flag is off.

## Tasks
- [ ] Add feature flag to app settings/config.
- [ ] Gate store UI and relevant API endpoints.
- [ ] Add tests for enabled/disabled behavior.

## Notes

## Relevant Files
- app/pages/store.vue
- app/utils/settings.ts
- server/api/admin/settings/[id]/update.ts
- shared/types/index.ts

## Progress Log
- 2026-04-13: Ticket created.


