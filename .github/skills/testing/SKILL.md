---
name: testing
description: "Use when running, debugging, or expanding ClassicForum tests; explains test phases, fixtures, commands, and concurrency-safe integration patterns."
argument-hint: "Optional test file or failure"
---

# ClassicForum Testing

## Commands

- Run the full integration suite with `yarn test`.
- Run one parallel test file with `yarn test tests/parallel/<file>.test.ts`.
- Run `yarn typecheck` when changes affect TypeScript or Vue templates.
- Run `yarn build` when changes affect route registration, Nuxt configuration, or production output.

The focused test command still runs the health test and all files under `tests/sequential` before the selected file. It selects only the file for the final parallel-test phase.

## Test Runner

`scripts/test-server.mjs` creates a temporary `.test-output-*` directory for the run, including an embedded SurrealDB database and media directory. It starts an isolated Nuxt test app, waits for `/api/health`, runs the test phases, then removes the temporary directory.

The phases are:

1. `tests/health.test.ts` and `tests/sequential/*.test.ts`, with sequential files ordered by filename and Vitest file parallelism disabled.
2. `tests/parallel/*.test.ts`, with file parallelism enabled.

Files in `tests/parallel` share the same running app and database. The test data is isolated from the normal app database, but parallel test files are not isolated from each other's records or fixture mutations.

`tests/test-server.ts` provides `fetch`, `grabUser`, `grabExampleServer`, and `expectStatus`. Example-server sessions and user sessions are stored under the temporary test directory and reused during the run.

## Safe Test Data

- Give each test-created record and searchable field a unique, test-specific value. Clean up records in `finally` blocks.
- Assert against records created by the current test, using their IDs or a unique marker. Do not compare global before/after lists or assume the total number or order of shared records stays fixed while parallel files run.
- Avoid changing roles or other state on shared example users in parallel files. Prefer a dedicated test user; when shared state is unavoidable, put that test in `tests/sequential` and restore state in `finally`.
- Keep concurrency behavior inside one test: issue the competing requests from that test and assert their outcomes. Do not rely on two test files racing each other to exercise application concurrency.

For example, after a rejected publish request, check that no gallery with that test's unique description exists instead of comparing every gallery before and after the request.

## Diagnosing Failures

1. Run `yarn test` first so the standard runner reports the failing phase and assertions.
2. Rerun a failing parallel file with `yarn test tests/parallel/<file>.test.ts` to check whether the failure depends on other parallel files. Health and sequential phases still run in this mode.
3. If the file passes alone but fails in the full run, inspect shared records, fixture-user mutations, global list snapshots, and assumptions about ordering before changing application behavior or weakening the assertion.
4. Fix isolation at the narrowest boundary, then rerun the focused file and the full suite.

The repository currently has no browser or component test suite. The integration suite does not replace visual or in-browser validation; report that coverage as unavailable rather than implied.