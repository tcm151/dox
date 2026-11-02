# Ticket 0076: Replace SurrealQL FETCH With Explicit Field Projections

## Status
- State: Planned
- Priority: Medium
- Next: Inventory SurrealQL FETCH clauses and identify the fields each caller consumes.

## Goal
Replace SurrealQL `FETCH` clauses with explicit field projections so each query returns only the fields its caller needs. Preserve existing response shapes while making selected nested data visible in the query.

## Requirements
- [ ] SurrealQL queries use explicit projections for related records instead of `FETCH`, including nested projections with aliases where needed.
- [ ] API response shapes and behavior remain compatible with existing consumers; projections include only fields required by those consumers.
- [ ] Tests cover affected response contracts, and the relevant test suite and type checks pass.
- [ ] An audit confirms no SurrealQL `FETCH` clauses remain in application queries; HTTP and client-side `fetch` APIs are unchanged.

## Tasks
- [ ] Inventory SurrealQL `FETCH` clauses and trace each selected relation to its consuming code.
- [ ] Replace each clause with explicit field mappings, preserving required nesting and output aliases.
- [ ] Update or add focused tests for affected query response contracts.
- [ ] Run relevant tests and type checks, then audit application queries for remaining SurrealQL `FETCH` clauses.

## Notes
- Follow existing projection patterns such as `images.{id, url} AS images`.
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
- 2026-11-01: Ticket created.