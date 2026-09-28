# Ticket 0002: Fix Stale Auth Token In Data Requests

## Status
- State: Done
- Priority: High
- Next action: None

## Goal
Ensure data fetches always use the latest access token so authenticated flows do not break after session token updates.

## Done Looks Like
- [x] `useDatasource` reads the current token after token refresh or replacement.
- [x] Datasource refetches no longer retain the token captured when the composable was created.
- [x] Explicit per-request headers can still override the default authorization header.

## Tasks
- [x] Identify the stale token capture in the static `useFetch` headers object.
- [x] Update the data utility to reference live token state at request time.
- [x] Verify the reactive default preserves explicit caller header overrides.

## Notes
- `useDatasource` now supplies its default authorization header through a computed value, so Nuxt refetches resolve the current session token.
- Automated regression coverage remains part of the broader test-baseline work tracked in backlog Tickets 0022 and 0027.

## Relevant Files
- app/utils/data.ts
- app/utils/session.ts
- server/utils/auth.ts
- server/api/profile/login.ts

## Progress Log
- 2026-09-28: Completed the reactive authorization header fix and moved the ticket to completed.
- 2026-09-28: Made datasource authorization headers reactive so refetches read the current access token.
- 2026-04-13: Ticket created.