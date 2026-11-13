# Ticket 0100: Make the AppSettings Schema Fully Strict

## Status
- State: Planned
- Priority: Medium
- Next: Compare every AppSettings field with the current database schema and identify legacy or schema-only fields.

## Dependencies
- [0098](0098-audit-appsettings-usage-and-gaps.md): Complete the settings inventory and resolve contract mismatches before locking the database schema.

## Goal
Make the database enforce the complete nested AppSettings contract instead of accepting arbitrary fields inside flexible settings objects.

## Requirements
- [ ] Every AppSettings field has an explicit database type and required/optional shape; any intentionally dynamic object is narrowly defined and documented.
- [ ] The database rejects undeclared nested settings and invalid field types, including on writes that bypass SettingsManager.
- [ ] The shared contract, defaults, SettingsManager validation, database schema, and migrated settings records agree.
- [ ] Existing installations retain valid settings through a replay-safe forward migration, and fresh installs start with the same strict shape.
- [ ] Tests cover unknown nested fields, invalid types, valid updates, and migration of current default settings.

## Tasks
- [ ] Inventory AppSettings fields across the shared contract, defaults, admin controls, validator, and current database records.
- [ ] Resolve schema-only or legacy fields, including `topics.enabled`, against the audited contract.
- [ ] Replace flexible nested settings objects with explicit field definitions and align SettingsManager validation.
- [ ] Add a replay-safe migration that preserves valid settings and removes or maps undeclared legacy data.
- [ ] Add focused database and API tests for strict shape enforcement and migration behavior.

## Notes
- The table is already declared `SCHEMAFULL`, but most nested settings objects are `TYPE object FLEXIBLE`; `Validator.object` validates only the fields listed by its callback and does not reject additional keys.
- Establish the strict schema before [Ticket 0099](0099-separate-image-upload-gallery-and-attachment-settings.md) adds image-policy fields.
- Preserve the audited AppSettings contract; do not make nested objects strict until schema-only and legacy fields have been classified.

## Relevant Files
- shared/types/index.ts
- shared/utils/Validator.ts
- app/utils/settings.ts
- app/pages/admin/settings.vue
- server/utils/SettingsManager.ts
- server/assets/schema.surql
- server/assets/migrations/
- tests/parallel/settings.server.test.ts

## Progress Log
- 2026-11-13: Ticket created.