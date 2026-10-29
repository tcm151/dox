# Ticket 0074: Adopt SurrealDB Record References

## Status
- State: Planned
- Priority: Medium
- Next: Inventory manually maintained cross-table relationships and their readers and writers

## Goal
Evaluate and adopt SurrealDB record references for cross-table relationships that are currently duplicated in manually maintained record lists. Preserve existing behavior while clarifying relationship ownership, traversal, and deletion semantics.

## Requirements
- [ ] Manually maintained cross-table lists and their create, update, and delete paths are inventoried; each is selected for conversion or documented as intentionally unchanged.
- [ ] Converted relationships use native references and computed incoming traversal where appropriate, with target-existence and deletion behavior explicitly defined.
- [ ] Fresh schema and a forward migration preserve existing relationships, and migration replay is safe.
- [ ] Updated API and shared-type consumers retain the required relationship context, with integration coverage for traversal and deletion behavior.

## Tasks
- [ ] Inventory relationship lists and their readers/writers, including topic content lists, post comments, and thread replies/quotes.
- [ ] Choose the source of truth, reverse traversal shape, existence checks, and deletion policy for each selected relationship.
- [ ] Verify record-reference behavior against the SurrealDB versions supported by the project.
- [ ] Update the fresh schema and add a versioned migration that safely transitions existing relationship data.
- [ ] Update affected API queries, shared types, and tests; verify migration replay and lifecycle behavior.

## Notes
- SurrealDB's [record references documentation](https://surrealdb.com/docs/reference/query-language/language-primitives/record-references) supports top-level fields containing a record or array of records and computed incoming traversal with `<~`.
- `REFERENCE` does not validate that the target exists; its default deletion behavior is `IGNORE`. Select explicit existence and `ON DELETE` behavior where required.
- Ticket 0072 depends on this work before selecting the gallery comment target and reverse lookup contract.

## Relevant Files
- server/assets/schema.surql
- server/assets/migrations/
- server/utils/migrations.ts
- shared/types/index.ts
- tests/sequential/03.migrations.test.ts

## Progress Log
- 2026-10-29: Ticket created.