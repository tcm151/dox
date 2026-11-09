---
name: testing
description: "Use when running, debugging, or expanding ClassicForum tests; explains test phases, fixtures, commands, and concurrency-safe integration patterns."
argument-hint: "Optional test file or failure"
---

# ClassicForum Testing

## Commands

- Run the full integration suite with `yarn --silent test`.
- Run one parallel test with `yarn --silent test tests/parallel/<file>.server.test.ts`, `yarn --silent test tests/parallel/<file>.browser.test.ts`, or `yarn --silent test tests/parallel/<file>.integration.test.ts`.
- Run `yarn typecheck` when changes affect TypeScript or Vue templates.
- Run `yarn build` when changes affect route registration, Nuxt configuration, or production output.

The focused test command runs only sequential files named `*.setup.server.test.ts` before the selected file. These files create fixtures consumed downstream; ordinary sequential tests are skipped. The runner caches the production test server under ignored `.nuxt/test-runner/`, keyed by app/server/shared/public source and build configuration; it still creates fresh temporary database and media directories for every run. Timing output summarizes total, startup/cache status, setup, test phases, and cleanup. Browser files are listed only when a file takes at least five seconds.

## Test Runner

`scripts/test-server.mjs` creates a temporary `.test-output-*` directory for the run, including an embedded SurrealDB database and media directory. It starts an isolated Nuxt test app, waits for `/api/health`, runs the test phases, then removes the temporary directory.

The phases are:

1. Full runs execute `tests/sequential/*.server.test.ts`, ordered by filename and run serially with Vitest file parallelism disabled. Focused runs execute only `tests/sequential/*.setup.server.test.ts` before the selected test.
2. `tests/parallel/*.server.test.ts`, run by Vitest with file parallelism enabled.
3. `tests/parallel/*.browser.test.ts` and `*.integration.test.ts`, run by Playwright in Chromium, serially within each file and with at most two files running concurrently.

All phases share the same running app and isolated database. Test files are colocated by phase; suffixes determine the runner. `.integration.test.ts` means one full-stack browser flow, not a file executed twice. Parallel tests are not isolated from each other's records or fixture mutations.

Shared test helpers live in `tests/utils/`. `test-server.ts` provides `fetch`, `grabUser`, `grabExampleServer`, and `expectStatus`; `browser-fixtures.ts` provides an authenticated browser page initialized from the isolated admin session and seeded example-server data. Use unauthenticated pages when a test needs to exercise the login UI. Example-server sessions and user sessions are stored under the temporary test directory and reused throughout the run. Failed runs still report aggregate phase timings and any slow browser files.

## Safe Test Data

- Give each test-created record and searchable field a unique, test-specific value. Clean up records in `finally` blocks.
- Assert against records created by the current test, using their IDs or a unique marker. Do not compare global before/after lists or assume the total number or order of shared records stays fixed while parallel files run.
- Avoid changing roles or other state on shared example users in parallel files. Prefer a dedicated test user; when shared state is unavoidable, put that test in `tests/sequential` and restore state in `finally`.
- Keep concurrency behavior inside one test: issue the competing requests from that test and assert their outcomes. Do not rely on two test files racing each other to exercise application concurrency.

For example, after a rejected publish request, check that no gallery with that test's unique description exists instead of comparing every gallery before and after the request.

## Diagnosing Failures

1. Run `yarn --silent test` first so the standard runner reports the failing phase and assertions.
2. Rerun a failing parallel file with `yarn --silent test tests/parallel/<file>.server.test.ts`, `yarn --silent test tests/parallel/<file>.browser.test.ts`, or `yarn --silent test tests/parallel/<file>.integration.test.ts` to check whether the failure depends on other parallel files. Required setup fixtures still run in this mode.
3. If the file passes alone but fails in the full run, inspect shared records, fixture-user mutations, global list snapshots, and assumptions about ordering before changing application behavior or weakening the assertion.
4. Fix isolation at the narrowest boundary, then rerun the focused file and the full suite.

Browser specs validate rendered markup, navigation, and interactions in Chromium. They complement API assertions and do not replace checks of database atomicity, authorization, migrations, or visual layout across browsers and viewport sizes.