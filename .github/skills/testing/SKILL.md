---
name: testing
description: "Use when running, debugging, or expanding ClassicForum tests; explains test phases, fixtures, commands, and concurrency-safe integration patterns."
argument-hint: "Optional test file or failure"
---

# ClassicForum Testing

## Commands

- Run the full integration suite with `yarn test` (no arguments).
- Run the ordered sequential server and browser suites with `yarn test --sequential`.
- Run sequential and parallel server tests without browser tests with `yarn test --server`.
- Run browser and integration tests with required setup fixtures, without server test suites, with `yarn test --browser`.
- Run one parallel test with `yarn test --file <file>.<type>.test.ts`.
- Inspect a retained Playwright trace with `yarn test --inspect <path-to-trace.zip>`; add `--report <path>` to save the summary.
- Run `yarn typecheck` when changes affect TypeScript or Vue templates.
- Run `yarn build` when changes affect route registration, Nuxt configuration, or production output.

The focused `--file` command supports only `tests/parallel/` server/browser/integration files. It executes only the sequential `*.setup.test.ts` fixtures before the selected parallel test; ordinary sequential server and browser tests are skipped. Sequential tests can only run in the full ordered suite with `--sequential` or `yarn test`. The runner caches the production test server under ignored `.nuxt/test-runner/`, keyed by app/server/shared/public source and build configuration; it still creates fresh temporary database and media directories for every run. Timing output summarizes total, startup/cache status, setup, test phases, and cleanup. Browser files are listed only when a file takes at least ten seconds.

## Test Runner

Use `docs/API.md` to locate route methods, access expectations, and detailed contracts. Confirm current behavior against the handler and tests; when a test exposes a route-contract change, reconcile the index as part of that change.

`scripts/test-runner/index.mjs` is the CLI entry point. `scripts/test-runner/server.mjs` creates a temporary `.test-output-*` directory for the run, including an embedded SurrealDB database and media directory, and starts an isolated Nuxt test app. The runner waits for `/api/health`, runs the test phases, then removes the temporary directory. Add `--keep-output` to retain the directory; the runner prints its path as `[test artifacts]`. Retained output includes temporary database, media, and session data. Run `yarn test --cleanup` as a standalone command to remove all root-level `.test-output-*` directories left by test or exploration runs, including their retained data and browser artifacts.

The phases are:

1. Full runs execute `tests/sequential/*.setup.test.ts` and `tests/sequential/*.server.test.ts`, ordered by filename and run serially with Vitest file parallelism disabled.
2. `tests/sequential/*.browser.test.ts` and `*.integration.test.ts`, run by Playwright in Chromium with one worker. `yarn test --sequential` runs both ordered sequential phases.
3. `tests/parallel/*.server.test.ts`, run by Vitest with up to two file workers. `--server` runs both sequential server and parallel server files without browser tests.
4. `tests/parallel/*.browser.test.ts` and `*.integration.test.ts`, run by Playwright in Chromium with up to two workers and one test at a time per file. `--browser` runs the setup fixtures and both browser phases without server test suites. Focused runs execute only setup files before the selected test.

All phases share the same running app and isolated database. Sequential files run in order; files within the parallel server and browser phases may overlap, with up to two workers per phase. Test files are colocated by phase; suffixes determine the runner. `.integration.test.ts` means one full-stack browser flow, not a file executed twice. Parallel files still share database state, so they must use unique records and clean up mutations.

Shared test helpers live in `tests/utils/`. `test-server.ts` provides `fetch`, `grabUser`, `grabExampleServer`, and `expectStatus`; `browser-fixtures.ts` provides an authenticated browser page initialized from the isolated admin session and seeded example-server data. Use unauthenticated pages when a test needs to exercise the login UI. Example-server sessions and user sessions are stored under the temporary test directory and reused throughout the run. Failed runs still report aggregate phase timings and any slow browser files.

## Safe Test Data

- Give each test-created record and searchable field a unique, test-specific value. Clean up records in `finally` blocks.
- Assert against records created by the current test, using their IDs or a unique marker. Do not compare global before/after lists or assume the total number or order of shared records stays fixed while parallel files run.
- Avoid changing roles or other state on shared example users in parallel files. Prefer a dedicated test user; when shared state is unavoidable, put that test in `tests/sequential` and restore state in `finally`.
- Keep concurrency behavior inside one test: issue the competing requests from that test and assert their outcomes. Do not rely on two test files racing each other to exercise application concurrency.

For example, after a rejected publish request, check that no gallery with that test's unique description exists instead of comparing every gallery before and after the request.

## Diagnosing Failures

1. Run `yarn test` first so the standard runner reports the failing phase and assertions.
2. Rerun a failing parallel file with `yarn test --file <file>.<type>.test.ts` to check it alone. Use only the test filename; required setup fixtures run before it. Sequential tests cannot be run individually; use `yarn test --sequential` to preserve their order.
3. If the console output is insufficient, add `--keep-output` to retain the `.test-output-*` directory and read the printed `[test artifacts]` path. Inspect `phase-*-summary.json` for the test report. For browser failures, use the matching `browser-results/` directory: read `error-context.md`, inspect `test-failed-*.png`, and run `yarn test --inspect <path-to-trace.zip>` to summarize the failing assertion, recent browser actions, API requests, and console warnings/errors. Use `--report <path>` to save the summary, or open the full trace with `yarn playwright show-trace <path-to-trace.zip>`. Run `yarn test --cleanup` after debugging to remove leftover test and exploration output directories.
4. If the file passes alone but fails in the full run, inspect shared records, fixture-user mutations, global list snapshots, and assumptions about ordering before changing application behavior or weakening the assertion.
5. Fix isolation at the narrowest boundary, then rerun the focused file and the full suite.

Browser specs validate rendered markup, navigation, and interactions in Chromium. They complement API assertions and do not replace checks of database atomicity, authorization, migrations, or visual layout across browsers and viewport sizes.