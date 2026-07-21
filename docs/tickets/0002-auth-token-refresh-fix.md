# Ticket 0002: Fix Stale Auth Token In Data Requests

## Status
- State: Todo
- Priority: High
- Next action: Reproduce stale-token behavior after token replacement

## Goal
Ensure data fetches always use the latest access token so authenticated flows do not break after session token updates.

## Done Looks Like
- [ ] useDatasource reads current token after token refresh/replacement.
- [ ] No stale Authorization headers are sent after login/session switch.
- [ ] Regression coverage exists for token replacement path.

## Tasks
- [ ] Reproduce issue in app/utils/data.ts with a token replacement scenario.
- [ ] Update data utility to reference live token state at request time.
- [ ] Add/adjust tests for replacement and normal request paths.

## Notes

## Relevant Files
- app/utils/data.ts
- app/utils/session.ts
- server/utils/auth.ts
- server/api/profile/login.ts

## Progress Log
- 2026-04-13: Ticket created.


