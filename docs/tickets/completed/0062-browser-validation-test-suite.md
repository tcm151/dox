# Ticket 0062: Browser Validation Test Suite

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Provide reusable browser-based integration test infrastructure for validating ClassicForum's mounted Nuxt UI, rendered markup, and user workflows. Run the real Nuxt/Nitro app against isolated test data and an embedded test database, following the existing backend suite's isolation model while keeping browser execution separate from API test phases.

## Requirements
- [x] A documented command runs browser tests in the unified integration suite against an isolated Nuxt/Nitro instance with temporary database and media storage.
- [x] Reusable fixtures manage app readiness, browser/context/page lifecycle, navigation, and authenticated test sessions.
- [x] A sequential setup phase seeds reusable sessions and representative content that parallel browser tests can consume from the same isolated app/database.
- [x] A representative test verifies rendered page or component markup and at least one user interaction through the browser.
- [x] Tests use controlled fixtures and normal application routes for internal behavior rather than replacing the app with component-only rendering or blanket API mocks.
- [x] Browser test failures include actionable browser/test output, and app, browser, and temporary data resources are reliably cleaned up locally and in CI.

## Tasks
- [x] Select and configure a browser runner that works with the mounted Nuxt app and existing Vitest-based test workflow.
- [x] Add an isolated browser-test lifecycle for the application server, browser, temporary storage, and fixture sessions.
- [x] Reuse sequential account/user setup and seed representative feed content before parallel browser tests run.
- [x] Add reusable browser navigation and authenticated-session helpers.
- [x] Add a representative rendered-markup and interaction test; document local and CI execution.
- [x] Verify server and browser tests share sequential setup, run in parallel phases, and clean up resources after success or failure.

## Notes
- Focus on browser-observable integration behavior: mounted pages/components, rendered markup, navigation, and interactions. API-only assertions remain in the existing integration suite.
- Running `yarn test` with no arguments executes all sequential and parallel test phases against one temporary app and database. `--server` runs the sequential and parallel server suites; `--browser` runs required setup fixtures and all browser/integration tests. `--sequential` runs only the ordered sequential suite. Passing a parallel test filename runs only required `*.setup.test.ts` fixtures, then dispatches the selected file by its `.server.test.ts`, `.browser.test.ts`, or `.integration.test.ts` suffix. The production test server is cached by source/configuration fingerprint, while every run gets fresh database and media storage. Timings summarize startup/cache status, setup, test phases, cleanup, and total; browser files are listed only when a file takes at least five seconds. Playwright runs tests serially within files with at most two files concurrently, and authenticated pages reuse the isolated admin session seeded during setup.
- `.integration.test.ts` is reserved for full-stack browser journeys that exercise UI and server behavior through one Playwright test.
- The example server exposes named user sessions and representative post/thread content through shared browser fixtures. Keep parallel tests read-only or clean up any test-created records.
- Use a real isolated application and embedded test database with deterministic fixtures; mock only external services that cannot safely run in tests.
- Ticket 0061 depends on this work for durable account-switch regression coverage.

## Relevant Files
- package.json
- playwright.config.ts
- scripts/test-server.mjs
- tests/utils/test-server.ts
- tests/utils/browser-fixtures.ts
- tests/sequential/
- tests/parallel/

## Progress Log
- 2026-11-09: Added serial reuse of default-account/example-user setup and browser-specific post/thread seeding; parallel Playwright specs now consume shared example-server sessions and feed content.
- 2026-11-09: Unified test execution so all server and browser setup completes before either parallel phase; `yarn test` now runs both domains against one isolated app/database.
- 2026-11-09: Expanded browser smoke coverage to home/posts feed sorting and navigation, Login popup dismissal, and the authenticated Profiles window lifecycle.
- 2026-11-09: Added an isolated Playwright Chromium phase, reusable UI-authenticated fixture, public navigation and authenticated UI smoke tests, CI setup, and contributor docs. `yarn typecheck` and the unified `yarn test` pass.
- 2026-10-25: Ticket created.
