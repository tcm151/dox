---
name: surrealql
description: "Use when writing, reviewing, debugging, or testing SurrealQL and database schema or migration changes in ClassicForum."
argument-hint: "Optional focus: query, schema, migration, or testing"
---

# SurrealQL in ClassicForum

Use the application's existing database wrapper and verify syntax against the deployed SurrealDB runtime. Upstream SurrealQL syntax and behavior can vary between versions.

## Sources of Truth

- `server/utils/DatabaseQuery.ts` owns database connections, parameter binding, result handling, and transaction retries.
- `server/assets/schema.surql` defines the current schema; `server/assets/migrations/` contains ordered changes for existing databases.
- `shared/types/` mirrors the application-facing data contract. Update it with schema changes when stored data shape changes.
- `docs/Architecture.md` describes startup and migration behavior. `docs/SurrealDB.md` documents deployment configuration.
- Follow the nearby query style, but validate uncertain behavior with the disposable embedded database rather than assuming a syntax detail.

## DatabaseQuery

- Access SurrealDB through `DatabaseQuery`, not a separately-created application connection.
- Add SQL with `.addSql(...)`. Bind ordinary values with `.addParameter(...)`; bind record IDs with `.addRecord(...)` or `.addRecords(...)`. Do not interpolate user-controlled values into SQL strings.
- Use `.execute()` for statement result sets, `.queryOne()` for the first row (404 when absent), `.queryAll()` for all rows from the first statement, and `.queryValue()` when the query returns a scalar or structured value that should not be unwrapped as a row.
- Every `addSql()` block containing multiple statements must use `.addTransaction()`. Count statements, not lines. The wrapper retries transaction conflicts up to three times.
- Return a structured result from a multi-statement workflow with a final `RETURN { ... }` and consume it with `.queryValue()`.
- Keep state-dependent authorization, validation, writes, and audit records in the same transaction when they must be atomic.

## Query Conventions

- Use uppercase SurrealQL keywords and terminate statements with semicolons inside multi-statement blocks. Use `$camelCase` parameters.
- Use `SELECT VALUE field` when only a projected field is needed. A normal table query returns an array, even with `LIMIT 1`.
- For a query constrained to at most one result, use `SELECT VALUE field FROM ONLY table ... LIMIT 1`; it returns the scalar value or `NONE`. This is the verified form for the installed embedded engine. Do not write `SELECT VALUE ONLY field`; that form fails to parse here.
- `FROM ONLY $recordId` is the established pattern for fetching a specific record as a single object. `FROM ONLY table` with a predicate and `LIMIT 1` is used when a single matching row is expected. Keep the limit or an appropriate uniqueness constraint so the query has a single-result contract.
- Do not unwrap a single-result SurrealQL subquery with `[0]` or `[0] ?? NONE`; use `FROM ONLY` to express its scalar result contract.
- `NONE` represents an absent value. Use explicit `= NONE` checks for optional values and `??` when supplying a meaningful fallback such as `[]` or a default audit value. The embedded client's JSON output may display `NONE` as `null` or omit an object property.
- Use record-aware helpers such as `record::exists()` and `record::tb()` for existence and table checks. Keep record references typed in schema definitions.
- Use array operators and functions (`IN`, `CONTAINS`, `.len()`, `array::union`, `array::last`) in SurrealQL rather than converting records to application strings for query logic.
- Use `fn::http(status, message)` for expected HTTP failures raised within a query; `DatabaseQuery` maps these application errors to HTTP errors.

## Schema and Migrations

- Define tables and fields in `server/assets/schema.surql`; use explicit field types, `option<T>` for optional fields, `record<table>` for references, and `ASSERT`/`REFERENCE` rules where the data contract requires them.
- Use `DEFAULT ALWAYS` when values must be populated on every write. Use computed fields or database events only where the existing schema already owns that behavior.
- Migrations must be replay-safe and follow the current in-progress version and release policy. Read `docs/Architecture.md` before changing migration behavior.
- Wrap migration changes and the migration-version update in a transaction. Preserve data through explicit backfills when a schema change affects existing records; verify the sequence in a disposable database.
- Do not rewrite a released migration by default. Consolidate only into a confirmed in-progress migration; otherwise add a forward migration.

## Safe Query Probes

- Use `node scripts/surreal-explore.mjs -` with inline JavaScript on stdin for disposable schema, migration, and query probes. The runner provides a fresh embedded database as `db` and Node's strict assertion API as `assert`, then removes the sandbox.
- Keep probes isolated from the app database. Test both a matching record and the absent-record case for scalar lookups, and test conflict-sensitive behavior concurrently when correctness depends on transaction retries.
- For behavioral changes, prefer the existing parallel integration tests after the disposable probe.