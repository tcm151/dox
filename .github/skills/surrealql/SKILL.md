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
- Use `.execute()` for statement result sets, `.queryOne()` for the first row of a result-set query (404 when absent), `.queryAll()` for all rows from the first statement, and `.queryValue()` when the query returns a scalar or structured value that should not be unwrapped as a row. `.queryOne()` unwraps `responses[0][0]`; do not pair it with `FROM ONLY`, which returns an already-unwrapped value. Consume `FROM ONLY` queries with `.queryValue<T>()`.
- Every `addSql()` block containing multiple statements must use `.addTransaction()`. Count statements, not lines. The wrapper retries transaction conflicts up to three times.
- Return a structured result from a multi-statement workflow with a final `RETURN { ... }` and consume it with `.queryValue()`.
- Keep state-dependent authorization, validation, writes, and audit records in the same transaction when they must be atomic.

## Query Conventions

- Use uppercase SurrealQL keywords and terminate statements with semicolons inside multi-statement blocks. Use `$camelCase` parameters.
- `VALUE` controls the projection shape; `ONLY` constrains the source to at most one record. Use `SELECT VALUE field FROM ONLY table ... LIMIT 1` for one scalar, which returns that value or `NONE`. This is the verified form for the installed embedded engine. Do not write `SELECT VALUE ONLY field`; that form fails to parse here.
- For one matching record with several projected fields, use `SELECT field1, field2 FROM ONLY table ... LIMIT 1`; it returns an object or `NONE`. Do not wrap the fields in `SELECT VALUE { ... }` when a normal multi-field projection already gives the desired object.
- `FROM ONLY $recordId` is the established pattern for fetching a specific record as a single object; consume it with `.queryValue<T>()`, not `.queryOne<T>()`. `FROM ONLY table` with a predicate and `LIMIT 1` is used when a single matching row is expected. Keep the limit or an appropriate uniqueness constraint so the query has a single-result contract.
- Do not unwrap a single-result SurrealQL subquery with `[0]` or `[0] ?? NONE`; use `FROM ONLY` to express its scalar result contract.
- `NONE` represents an absent value. Use explicit `= NONE` checks for optional values and `??` when supplying a meaningful fallback such as `[]` or a default audit value. The embedded client's JSON output may display `NONE` as `null` or omit an object property.
- Use record-aware helpers such as `record::exists()` and `record::tb()` for existence and table checks. `record::exists()` expects a record ID; use it for a bound record reference, but compare a `LET` value returned by `SELECT ... FROM ONLY` with `NONE` because that result may be absent.
- Use array operators and functions (`IN`, `CONTAINS`, `.len()`, `array::union`, `array::last`) in SurrealQL rather than converting records to application strings for query logic.
- For authorization across candidate topic IDs, use one set-based query to select authorized IDs and reject when `$authorizedTopics.len() = 0`. Avoid scanning candidates with a `.some()` closure that checks membership in a query result; with record-derived topic data this can exceed computation depth in the installed runtime.
- In moderation queries, bind the combined target record and user record as `$target` and `$user`. Keep the route's broad `requireRole` guard, and perform state-dependent topic authorization and any admin bypass check against `$user.roles` in SQL.
- Use `fn::http(status, message)` for expected HTTP failures raised within a query; `DatabaseQuery` maps these application errors to HTTP errors.

## Schema and Migrations

- Define tables and fields in `server/assets/schema.surql`; use explicit field types, `option<T>` for optional fields, `record<table>` for references, and `ASSERT`/`REFERENCE` rules where the data contract requires them.
- Use `DEFAULT ALWAYS` when values must be populated on every write. Use computed fields or database events only where the existing schema already owns that behavior.
- Migrations must be replay-safe and follow the current in-progress version and release policy. Design each migration as an upgrade from the immediately previous released schema and its supported data, not from intermediate development schemas. Read `docs/Architecture.md` before changing migration behavior.
- Wrap migration changes and the migration-version update in a transaction. Preserve data through explicit backfills when a schema change affects existing records; verify the sequence in a disposable database.
- Do not rewrite a released migration by default. Consolidate only into a confirmed in-progress migration; otherwise add a forward migration.
- Do not encode compatibility steps solely for a local database altered by unreleased development iterations. Repair a divergent development database manually with the developer/admin query or rebuild it from the previous-release baseline, then test the migration against that baseline. Keep backfills for data that can genuinely exist in the previous release.

## Safe Query Probes

- Use `node scripts/surreal-explore.mjs -` with inline JavaScript on stdin for disposable schema, migration, and query probes. The runner provides a fresh embedded database as `db` and Node's strict assertion API as `assert`, then removes the sandbox. For migration probes, construct the previous released schema and representative data rather than copying an intermediate development schema.
- Keep probes isolated from the app database. Test both a matching record and the absent-record case for scalar lookups, and test conflict-sensitive behavior concurrently when correctness depends on transaction retries.
- For behavioral changes, prefer the existing parallel integration tests after the disposable probe.