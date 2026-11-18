---
name: testing
description: "Use when running, debugging, or expanding ClassicForum tests; explains test phases, fixtures, commands, and concurrency-safe integration patterns."
argument-hint: "Optional test file or failure"
---

# ClassicForum Testing

## Commands

- Run the full integration suite with `yarn test` (no arguments).
- Run only the ordered sequential suite with `yarn test --sequential`.
- Run sequential and parallel server tests without browser tests with `yarn test --server`.
- Run browser and integration tests with required setup fixtures, without server test suites, with `yarn test --browser`.
- Run one parallel test with `yarn test --file <file>.<type>.test.ts`.
- Run `yarn typecheck` when changes affect TypeScript or Vue templates.
- Run `yarn build` when changes affect route registration, Nuxt configuration, or production output.

The focused `--file` command supports only tests under `tests/parallel/`; individual sequential tests cannot be selected because they run in order. It runs only sequential files named `*.setup.test.ts` before the selected file. These files create fixtures consumed downstream; ordinary sequential tests are skipped. Use `--sequential` to run the ordered sequential suite. The runner caches the production test server under ignored `.nuxt/test-runner/`, keyed by app/server/shared/public source and build configuration; it still creates fresh temporary database and media directories for every run. Timing output summarizes total, startup/cache status, setup, test phases, and cleanup. Browser files are listed only when a file takes at least five seconds.

## Test Runner

Use `docs/API.md` to locate route methods, access expectations, and detailed contracts. Confirm current behavior against the handler and tests; when a test exposes a route-contract change, reconcile the index as part of that change.

`scripts/test-server.mjs` creates a temporary `.test-output-*` directory for the run, including an embedded SurrealDB database and media directory. It starts an isolated Nuxt test app, waits for `/api/health`, runs the test phases, then removes the temporary directory. Add `--keep-output` to retain the directory; the runner prints its path as `[test artifacts]`. Retained output includes temporary database, media, and session data.

The phases are:

1. Full runs execute `tests/sequential/*.setup.test.ts` and `tests/sequential/*.server.test.ts`, ordered by filename and run serially with Vitest file parallelism disabled. `yarn test --sequential` runs only this phase. `--server` runs this phase and parallel server tests; `--browser` runs only the required `*.setup.test.ts` fixtures before the browser suite. Focused runs execute only `*.setup.test.ts` files before the selected parallel test.
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

1. Run `yarn test` first so the standard runner reports the failing phase and assertions.
2. Rerun a failing parallel file with `yarn test --file <file>.server.test.ts`, `yarn test --file <file>.browser.test.ts`, or `yarn test --file <file>.integration.test.ts` to check whether the failure depends on other parallel files. Use only the test filename. Required setup fixtures still run in this mode. Individual sequential files cannot be run with `--file`; use `yarn test --sequential`.
3. If the console output is insufficient, add `--keep-output` to retain the `.test-output-*` directory and read the printed `[test artifacts]` path. Inspect `phase-*-summary.json` for the test report. For browser failures, use the matching `browser-results/` directory: read `error-context.md`, inspect `test-failed-*.png`, and open `trace.zip` with `yarn playwright show-trace <path-to-trace.zip>`. The trace includes browser actions and network activity. Remove the retained directory after debugging.
4. If the file passes alone but fails in the full run, inspect shared records, fixture-user mutations, global list snapshots, and assumptions about ordering before changing application behavior or weakening the assertion.
5. Fix isolation at the narrowest boundary, then rerun the focused file and the full suite.

Browser specs validate rendered markup, navigation, and interactions in Chromium. They complement API assertions and do not replace checks of database atomicity, authorization, migrations, or visual layout across browsers and viewport sizes.