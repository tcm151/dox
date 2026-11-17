# Ticket 0055: Consistent Database Error Mapping

## Status
- State: Planned
- Priority: Medium
- Next: Inventory unmapped schema/driver failures and broad query-error catches against the existing APP_ERROR mapping.

## Goal
Complete consistent database-error classification and call-site handling on top of the existing APP_ERROR mapping. Preserve expected HTTP failures and useful diagnostics without converting unexpected failures into ordinary negative results.

## Requirements
- [ ] Expected validation, authorization, conflict, and missing-record errors map to consistent HTTP statuses.
- [ ] Unexpected database failures remain server errors and do not expose sensitive driver details to clients.
- [ ] API handlers can rely on the centralized mapping instead of parsing database error strings locally.
- [ ] Existence checks distinguish a genuine no-match result from database failure; broad catches cannot report an outage as an available username or another successful negative response.
- [ ] Representative mappings are covered by automated tests.

## Tasks
- [ ] Inventory remaining schema/driver error payloads and query-error catches against the supported client/runtime versions.
- [ ] Preserve the existing fn::http/APP_ERROR mapping and classify only the remaining expected failure cases.
- [ ] Keep classification centralized in DatabaseQuery without double-wrapping already-classified HTTP errors.
- [ ] Replace catch-all negative results and remaining route-specific message parsing where centralized handling applies.
- [ ] Correct existence-query result typing and handle genuine missing rows explicitly.
- [ ] Add focused tests for expected and unexpected database errors.

## Notes
- DatabaseQuery.execute already maps recognized thrown APP_ERROR statuses in the 400-599 range, retaining the application message; other query failures become generic HTTP 500 errors with their cause retained.
- The username-taken handler catches every query failure and returns false. Its SELECT id query is also annotated as queryOne<string> despite returning a row object.
- ReportManager.create has another broad query-error catch to review for redundant wrapping and diagnostic behavior; audit current call sites rather than relying on the original route inventory.
- This ticket addresses database classification and callers. Shared input rules are separate under [0121](0121-unify-shared-validation-rules-and-boundaries.md), and client HTTP-error presentation is separate under [0122](0122-normalize-client-mutation-and-error-lifecycles.md).
- Related cleanup behavior is tracked in [Ticket 0001](completed/0001-media-delete-atomicity.md) and [Ticket 0052](completed/0052-image-attachment-ownership-and-refunds.md).

## Relevant Files
- server/utils/DatabaseQuery.ts
- server/api/profile/username-taken.ts
- server/utils/ReportManager.ts
- server/plugins/errorHandler.ts
- tests/utils/test-database-query.ts
- tests/parallel/account.server.test.ts

## Progress Log
- 2026-11-17: Refreshed the implementation inventory after the developer consistency review, recognized existing APP_ERROR support, and raised priority to Medium. All implementation and validation tasks remain open; no executable checks were performed.
- 2026-10-23: Ticket created.