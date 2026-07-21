# Ticket 0027: API Smoke Tests Baseline

## Status
- State: Todo
- Priority: High
- Next action: Pick first critical flows for smoke coverage

## Goal
Add minimal API smoke tests for auth and core content/moderation flows.

## Done Looks Like
- [ ] Smoke tests cover login/auth, post create, thread reply, and report flow.
- [ ] Tests run in CI with deterministic setup/teardown.
- [ ] Failures clearly identify broken flow stage.

## Tasks
- [ ] Choose test harness and baseline test layout.
- [ ] Implement smoke fixtures and seed/reset strategy.
- [ ] Add first-pass tests for critical endpoints.

## Notes
- Prioritize confidence over full route coverage.

## Relevant Files
- [server/api/profile/login.ts](../../server/api/profile/login.ts)
- [server/api/post/add.ts](../../server/api/post/add.ts)
- [server/api/thread/[id]/reply.ts](../../server/api/thread/[id]/reply.ts)
- [server/api/report/send.ts](../../server/api/report/send.ts)
- [package.json](../../package.json)

## Progress Log
- 2026-04-13: Ticket created.
