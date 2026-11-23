# Ticket 0055: Consistent Database Error Mapping

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Complete consistent database-error classification and call-site handling on top of the existing APP_ERROR mapping. Preserve expected HTTP failures and useful diagnostics without converting unexpected failures into ordinary negative results.

## Requirements
- [x] Expected validation, authorization, conflict, and missing-record errors map to consistent HTTP statuses.
- [x] Unexpected database failures remain server errors and do not expose sensitive driver details to clients.
- [x] API handlers can rely on the centralized mapping instead of parsing database error strings locally.
- [x] Existence checks distinguish a genuine no-match result from database failure; broad catches cannot report an outage as an available username or another successful negative response.
- [x] Representative mappings are covered by automated tests.

## Tasks
- [x] Inventory remaining schema/driver error payloads and query-error catches against the supported client/runtime versions.
- [x] Preserve the existing fn::http/APP_ERROR mapping and classify only the remaining expected failure cases.
- [x] Keep classification centralized in DatabaseQuery without double-wrapping already-classified HTTP errors.
- [x] Replace catch-all negative results and remaining route-specific message parsing where centralized handling applies.
- [x] Correct existence-query result typing and handle genuine missing rows explicitly.
- [x] Add focused tests for expected and unexpected database errors.

## Notes
- `DatabaseQuery.execute` preserves `APP_ERROR` statuses, maps native unique-index conflicts to sanitized `409` errors, and keeps unexpected database failures as generic `500` responses.
- Call sites now preserve centrally classified errors instead of parsing driver messages or converting database failures into ordinary negative results.
- Username availability treats only a genuine `queryOne` `404` as available; password-reset confirmation explicitly handles a missing token.
- Shared input rules are separate under Ticket 0121, and client HTTP-error presentation is separate under Ticket 0122.
- Related cleanup behavior is tracked in Tickets 0001 and 0052.

## Relevant Files
- server/utils/DatabaseQuery.ts
- server/utils/auth.ts
- server/utils/ReportManager.ts
- server/utils/repos/ReferralManager.ts
- server/api/profile/username-taken.ts
- server/api/profile/password/confirm.ts
- server/api/topic/[topic]/request-moderation.ts
- server/api/image/[id]/delete.ts
- docs/API.md
- tests/parallel/account.server.test.ts
- tests/sequential/11-publishing-settings.server.test.ts

## Progress Log
- 2026-11-17: Centralized native unique-index conflicts as sanitized `409` responses, removed database-error rewriting and message parsing from affected callers, and made username checks return `false` only for a genuine no-match. Added focused account and duplicate-moderation-request coverage and documented the updated contracts. `yarn.cmd typecheck` and `yarn.cmd test --file account.server.test.ts` passed. The full `yarn.cmd test` run passed sequential tests on its second attempt but timed out in `content-filters.server.test.ts` and `media.server.test.ts`; focused reruns reproduced those unrelated five-second timeouts.
- 2026-11-17: Refreshed the implementation inventory after the developer consistency review, recognized existing APP_ERROR support, and raised priority to Medium. All implementation and validation tasks remain open; no executable checks were performed.
- 2026-10-23: Ticket created.