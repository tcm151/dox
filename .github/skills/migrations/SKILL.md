---
name: migrations
description: "Use when changing or validating ClassicForum SurrealDB schemas, migrations, data upgrades, or migration versions."
argument-hint: "Optional focus: schema, migration, data backfill, or validation"
---

# Schema And Migrations

Use this workflow for SurrealDB schema and stored-data changes.

## Sources

- `server/assets/schema.surql` defines fresh databases; `server/assets/migrations/` upgrades existing ones.
- Keep `shared/types/` aligned with stored fields and record references.
- Read `docs/Architecture.md` and `docs/SurrealDB.md` for startup and database behavior. Check `server/utils/migrations.ts` before changing the runner.

## Workflow

1. Check `git status --short`. Inspect the schema, shared types, migrations, app version, and relevant ticket; preserve existing edits.
2. Update the fresh schema and shared types. Add a versioned migration when existing databases need the change; a schema edit alone does not upgrade them.
3. Keep fresh installs and upgraded databases equivalent for the changed contract. Design upgrades from the immediately previous released schema and its supported data, not from intermediate development schemas. Inspect the current migration and release version before editing; only consolidate into a confirmed unreleased migration. Add a forward migration for released versions.
4. Plan data transitions and backfills before tightening constraints or removing fields. Test destructive or order-sensitive changes with representative data in a disposable database.
5. Validate fresh installation and upgrade from the immediately previous released schema, using representative data that could exist in that release. Check the recorded version and replay the migration when supported. Run focused tests, then broader tests when behavior changes.

## Development Database Drift

- Do not add migration branches or compatibility steps solely to handle a local database changed by intermediate, unreleased development work. Such a database is not an upgrade source contract.
- If a development database diverges from the expected previous release, repair it manually with the developer/admin query or rebuild it from the previous release, then validate the migration against that release baseline.
- Keep migration backfills for data that can genuinely exist in the previous released version; do not omit those transformations in the name of a clean migration.

## Fresh Schema

- Use table and function comment banners. Match nearby formatting for fields, queries, and events.
- Use explicit types, `option<T>` for optional fields, and `record<table>` for references. Follow existing `ASSERT`, `REFERENCE`, default, computed-field, and event patterns.
- Update the shared TypeScript contract with schema changes.

## Migrations

- Match fresh-schema statement formatting; do not copy its table banners into migrations.
- Put a concise, one-line `--` rationale before each logically scoped upgrade block.
- Wrap changes and the version update in `BEGIN TRANSACTION;` and `COMMIT;`.
- Make migrations replay-safe. Use conditional schema operations where supported and make data changes tolerate replay.
- Backfill existing records when new required fields or representations need values. For `SCHEMAFULL` field removal, follow the programming guidance for the `option<T>`, unset, and remove sequence.
- Fresh databases apply `schema.surql` with the app version. Existing databases apply newer migrations in version order; startup fails readiness if a migration fails.
- The developer replay route runs only the migration matching the app and database versions. Keep the active migration replay-safe from its expected previous-release baseline; do not make it accommodate arbitrary local schema drift.

## Validation

- Use `node scripts/surreal-explore.mjs -` for disposable probes. It provides `db` and `assert`; never use the app database.
- For upgrades, apply the immediately previous released schema/version with representative old data, run the migration, and check schema/data/version. Do not use a partially migrated development database as the upgrade fixture; adjust it manually through the admin query or rebuild it from the baseline.
- For fresh-schema changes, apply the full schema and assert the affected fields, indexes, events, references, or computed behavior.
- Run `yarn --silent test` when application behavior changes and `yarn typecheck` when TypeScript or Vue code changes.
- Follow `.github/skills/surrealql/SKILL.md` for query conventions and `docs/SurrealDB.md` for deployment details.
