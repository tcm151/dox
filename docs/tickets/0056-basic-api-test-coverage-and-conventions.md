# Ticket 0056: Basic API Test Coverage and Conventions

## Status
- State: Planned
- Priority: Medium
- Next: Select a small set of currently-uncovered basic API operations

## Goal
Expand the starter integration suite beyond health checks with a few representative basic API operations. Establish a clear, repeatable pattern for organizing, setting up, and asserting future integration tests.

## Requirements
- [ ] A small set of currently-uncovered basic API operations has focused integration coverage in test modules separate from `health.test.ts`.
- [ ] Tests demonstrate useful success assertions and at least one meaningful expected failure assertion.
- [ ] Tests use the shared isolated harness and deterministic test data.
- [ ] The contribution guide documents where tests belong and how to add more using the established pattern.

## Tasks
- [ ] Select three to five basic operations that do not duplicate coverage planned in Tickets 0022 and 0027.
- [ ] Add focused tests and only the reusable setup or fixtures needed for those operations.
- [ ] Keep `health.test.ts` focused on startup and readiness checks.
- [ ] Document test organization, setup, cleanup, and assertion conventions.

## Notes
- Keep this as a deliberately small baseline, not comprehensive route or contract coverage.
- Ticket 0019's referral replay and concurrency tests are deferred until this baseline is established.

## Relevant Files
- tests/health.test.ts
- tests/
- scripts/test-server.mjs
- docs/ContributionGuide.md

## Progress Log
- 2026-10-23: Ticket created.
