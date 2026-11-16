# Ticket 0076: Replace SurrealQL FETCH With Explicit Field Projections

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Replace SurrealQL `FETCH` clauses with explicit field projections so each query returns only the fields its caller needs. Preserve existing response shapes while making selected nested data visible in the query.

## Requirements
- [x] SurrealQL queries use explicit projections for related records instead of `FETCH`, with aliases only where needed.
- [x] API response shapes and behavior remain compatible with existing consumers; projections include only fields required by those consumers.
- [x] Tests cover affected response contracts, and the relevant test suite and type checks pass.
- [x] An audit confirms no SurrealQL `FETCH` clauses remain in application queries; HTTP and client-side `fetch` APIs are unchanged.

## Tasks
- [x] Inventory SurrealQL `FETCH` clauses and trace each selected relation to its consuming code.
- [x] Replace each clause with explicit field mappings, preserving required nesting and using aliases only where needed.
- [x] Update or add focused tests for affected query response contracts.
- [x] Run relevant tests and type checks, then audit application queries for remaining SurrealQL `FETCH` clauses.

## Notes
- Follow explicit field-path projections such as `images.{id, url}`; add aliases only when the projected expression needs a name or a different output key.
- Coordinate changes to thread queries with Ticket 0075 if the work proceeds concurrently.
- Scope is SurrealQL `FETCH`; ordinary HTTP and client-side `fetch` calls are not part of this work.

## Relevant Files
- server/api/
- server/routes/
- server/utils/
- tests/
- server/api/feed/search.ts
- server/utils/feedPagination.ts

## Progress Log
- 2026-11-16: Completed the projection audit, removed redundant same-name aliases, restored topic link/gallery fields, fixed the settings account binding, and isolated rate-limit test IPs. Focused projection suites and typecheck pass; the full server phase has one unrelated settings test failure because its expected content omits schema-required filters.
- 2026-11-16: Replaced active application FETCH clauses with explicit relation projections, added focused response assertions and projection guidance, and validated the 2026.6.3 migration from v2026.6.2. Focused suites pass; full suite hit a parallel registration 429, and typecheck reports an unrelated undefined account in settings/misc.vue.
- 2026-11-01: Ticket created.