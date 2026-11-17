# Ticket 0079: Validate Application Settings

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Validate application settings at the server boundary so malformed or out-of-range values cannot be saved by bypassing the admin UI.

## Requirements
- [x] Every persisted `AppSettings` group and field is validated server-side.
- [x] Invalid types and values outside documented limits are rejected before settings or dependent state are changed.
- [x] Tests cover invalid and valid updates and confirm rejected updates leave persisted settings unchanged.

## Tasks
- [x] Define runtime validation rules for every `AppSettings` field, including numeric bounds and array contents.
- [x] Validate settings before persistence and before reconciling moderator requests.
- [x] Add API integration coverage for malformed settings and persistence safety.

## Notes
- `SettingsManager.update` currently writes settings without runtime validation.
- The `appSettings` nested schema objects are flexible, so database schema constraints do not enforce the TypeScript contract.
- Keep server validation authoritative; admin form attributes are not a security or data-integrity boundary.

## Relevant Files
- server/utils/SettingsManager.ts
- server/api/admin/settings/[id]/update.ts
- shared/utils/Validator.ts
- shared/types/index.ts
- server/assets/schema.surql
- app/pages/admin/settings.vue
- tests/parallel/settings.server.test.ts

## Progress Log
- 2026-11-02: Added composable array validation with indexed error paths; completed AppSettings validation and API coverage. Focused settings tests pass (13/13) and `yarn typecheck` passes.
- 2026-11-02: Ticket created and implementation started after auditing application settings validation.