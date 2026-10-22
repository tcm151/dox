# Ticket 0054: General-Purpose Automated Test Harness

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Establish a reusable integration-first test harness that starts the full Nuxt/Nitro application against an isolated embedded SurrealDB database and temporary media storage. Tests should exercise the running app over HTTP and make it straightforward to add API coverage incrementally.

## Requirements
- [x] A supported test runner provides one documented command that starts and stops a Nuxt/Nitro test instance.
- [x] The test instance uses an embedded SurrealDB database and media directory isolated from development and production data; setup fails closed if test-only paths are missing or unsafe.
- [x] Reusable setup waits for application readiness, initializes a clean schema, and tears down the server and temporary data deterministically.
- [x] Tests exercise the running application through HTTP and produce clear failure output.
- [x] A starter smoke test verifies the app becomes ready and responds to a representative API request.
- [x] The same test command is deterministic and suitable for CI, and the contribution guide explains local use and how to add coverage.

## Tasks
- [x] Evaluate runners that can launch Nuxt/Nitro and manage HTTP integration tests, including Vitest with Nuxt test utilities.
- [x] Add runner configuration, a standard integration-test layout, and a package script.
- [x] Create guarded test configuration, temporary embedded-database and media paths, readiness checks, and deterministic teardown.
- [x] Add a starter HTTP smoke test and verify repeatable local execution.
- [x] Document test conventions and the local workflow; expose a stable command for CI.

## Notes
- Treat full-server integration tests as the initial supported workflow; add faster isolated unit tests where useful, without requiring them for the first harness slice.
- Ticket 0026 owns the GitHub Actions CI pipeline; this ticket provides a test command it can invoke.
- Tickets 0022 and 0027 add domain-specific contract and API smoke coverage on top of the shared harness.

## Relevant Files
- package.json
- docs/ContributionGuide.md
- scripts/test-server.mjs
- tests/health.test.ts
- .gitignore

## Progress Log
- 2026-10-22: Documented the integration test workflow and marked the harness complete after repeated successful `yarn test` runs.
- 2026-10-22: Added a Vitest/Nuxt Test Utils E2E harness with fresh embedded SurrealDB/media directories and an HTTP health smoke test; `yarn test` passed twice.
- 2026-10-22: Ticket created.