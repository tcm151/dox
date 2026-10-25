# Ticket 0027: API Smoke Tests Baseline

## Status
- State: Completed
- Priority: High
- Next: None

## Dependencies
- [0026](../0026-ci-pipeline-baseline.md): CI must run the API smoke tests reliably.
- [0054](0054-general-purpose-automated-test-harness.md): Provides the shared test runner and reusable setup/example users.

## Goal
Add minimal API smoke tests for auth and core content/moderation flows.

## Requirements
- [x] Smoke tests cover login/auth, post create, thread reply, and report flow.
- [x] Tests run in CI with deterministic setup/teardown.
- [x] Failures clearly identify broken flow stage.

## Tasks
- [x] Use the shared test harness and define the API smoke-test layout.
- [x] Implement example users and seed/reset strategy.
- [x] Add first-pass tests for critical endpoints.

## Notes
- Prioritize confidence over full route coverage.
- Ticket 0056 covers login/session reuse and minimal post publication; retain those checks and avoid duplicating the standalone post test.
- The sequential example-user phase seeds independent reporter, thread-author, and reply-author sessions before parallel smoke tests run.

## Relevant Files
- server/api/profile/login.ts
- server/api/post/add.ts
- server/api/thread/[id]/reply.ts
- server/api/report/send.ts
- tests/sequential/01-default-user.test.ts
- tests/sequential/04-example-users.test.ts
- tests/parallel/posts.test.ts
- tests/parallel/threads.test.ts
- tests/parallel/reports.test.ts
- package.json

## Progress Log
- 2026-10-25: Completed login/session, post, thread reply, report, and admin visibility smoke coverage in the shared CI integration suite.
- 2026-10-25: Started after CI baseline completion; existing login and post coverage will be reused while adding reply and report flows.
- 2026-04-13: Ticket created.