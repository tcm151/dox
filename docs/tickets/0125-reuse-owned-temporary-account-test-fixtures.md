# Ticket 0125: Reuse Owned Temporary Account Test Fixtures

## Status
- State: Planned
- Priority: Medium
- Next: Compare duplicated account setup and cleanup in content-filter and profile-privacy tests.

## Goal
Extend existing test helpers with a small, reliable lifecycle for ordinary per-test accounts. Reduce repeated registration/authentication boilerplate without making parallel tests depend on mutable shared users.

## Requirements
- [ ] Reusable temporary-account creation returns the established TSession shape and, where useful, the existing authenticated request methods.
- [ ] Account identifiers and associated searchable fixture values are unique per owning test.
- [ ] Teardown targets only records owned by that test, including its account/session/settings data, and runs after assertion or setup failures.
- [ ] Created users remain ordinary and unconfirmed by default; tests explicitly opt into any different fixture state they require.
- [ ] Content-filter and profile-privacy specs use the helper without weakening their API assertions or mixing cleanup responsibility.
- [ ] The standard runner, named seeded sessions, browser fixtures, and sequential/parallel phase boundaries remain unchanged.
- [ ] Fixture failure, cleanup, and concurrent ownership cases have appropriate coverage; rate-limit tests retain control over the client identity under test.

## Tasks
- [ ] Inventory repeated temporary-account registration, authentication, session types, and cleanup code against existing test-server helpers.
- [ ] Expose the smallest reusable account/session lifecycle through the current test utilities.
- [ ] Keep test-specific content cleanup explicit instead of introducing a broad database-reset or fixture-pool mechanism.
- [ ] Migrate the content-filter and profile-privacy test examples first.
- [ ] Verify cleanup after failures and isolation under the standard parallel runner in an execution-enabled environment.

## Notes
- Both inspected specs define a local account type and repeat registration followed by profile authentication. TSession already represents that user/access-token pair.
- tests/utils/test-server.ts already owns named sessions, authenticated request wrappers, unique client addresses, and response-status helpers; build on it rather than creating another harness.
- Completed [0054](completed/0054-general-purpose-automated-test-harness.md) and [0056](completed/0056-basic-api-test-coverage-and-conventions.md) establish the runner and conventions.
- This is a developer-facing fixture reuse improvement, not a claim that the inspected tests currently fail. [0118](0118-close-public-release-validation-gaps.md) separately tracks recorded runtime validation gaps.

## Relevant Files
- tests/utils/test-server.ts
- tests/utils/test-sessions.ts
- tests/utils/browser-fixtures.ts
- tests/parallel/content-filters.server.test.ts
- tests/parallel/profile-privacy.server.test.ts
- docs/Contributing.md

## Progress Log
- 2026-11-17: Ticket created from the developer consistency review. The test runner and fixture lifecycle were not executed.
