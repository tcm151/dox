# Ticket 0056: Basic API Test Coverage and Conventions

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Expand the starter integration suite beyond health checks with a few representative basic API operations. Establish a clear, repeatable pattern for organizing, setting up, and asserting future integration tests.

## Requirements
- [x] A small set of currently-uncovered basic API operations has focused integration coverage in test modules separate from `health.test.ts`.
- [x] Tests demonstrate useful success assertions and at least one meaningful expected failure assertion.
- [x] Tests use the shared isolated harness and deterministic test data.
- [x] Sequential tests can persist and reload named user sessions between test processes.
- [x] The contribution guide documents where tests belong and how to add more using the established pattern.

## Tasks
- [x] Select a small baseline that complements broader coverage planned in Tickets 0022 and 0027.
- [x] Add focused tests and only the reusable setup or example data needed for those operations.
- [x] Keep `health.test.ts` focused on startup and readiness checks.
- [x] Document test organization, setup, cleanup, and assertion conventions.
- [x] Add keyed user-session storage for sequential tests.

## Notes
- Keep this as a deliberately small baseline, not comprehensive route or contract coverage.
- The baseline covers the public user list, default-user login/session reuse, and minimal post publishing. Ticket 0027 retains the broader auth/content/moderation smoke workflow.
- Ticket 0019's referral replay and concurrency tests are deferred until this baseline is established.

## Relevant Files
- tests/health.test.ts
- tests/sequential/01-database-response.test.ts
- tests/sequential/02-default-user-login.test.ts
- tests/sequential/03-admin-session-reuse.test.ts
- tests/sequential/04-post-publishing.test.ts
- tests/test-server.ts
- tests/
- scripts/test-server.mjs
- server/utils/repos/SessionManager.ts
- docs/ContributionGuide.md

## Progress Log
- 2026-10-23: Completed the baseline after `yarn test` passed, including authenticated post deletion cleanup; fixed post deletion's user record binding and used the shared `extractId` helper in the test.
- 2026-10-23: Expanded the baseline to include a minimal authenticated post publish, unauthenticated rejection, and post cleanup; broader smoke coverage remains in Ticket 0027.
- 2026-10-23: Added keyed session storage under disposable test data; a later sequential test reloads and uses the saved admin session.
- 2026-10-23: Verified the default user and roles, login, and token-authenticated profile lookup. Fixed session creation to pass the account relation as a record ID; post-publishing coverage remains next.
- 2026-10-23: Added a shared test app and ordered sequential/parallel phases; health and the first public topic-list test pass. Bootstrap checks for schema, default-user setup, login, and publishing remain next.
- 2026-10-23: Ticket created.