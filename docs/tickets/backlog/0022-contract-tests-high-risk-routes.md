# Ticket 0022: Contract Tests For High-Risk Routes

## Status
- State: Todo
- Priority: High
- Next action: Select first 5 endpoints for contract coverage

## Goal
Add tests around critical API contracts to catch regressions in auth, moderation, media, and vote/report flows.

## Done Looks Like
- [ ] High-risk routes have baseline contract tests.
- [ ] Tests validate status codes, auth gates, and key response fields.
- [ ] CI runs contract tests reliably.

## Tasks
- [ ] Define high-risk endpoint list.
- [ ] Implement test fixtures and helpers.
- [ ] Add contract assertions for success and failure cases.

## Notes

## Relevant Files
- package.json
- server/api/profile/login.ts
- server/api/topic/[topic]/reports.ts
- server/api/image/upload.ts

## Progress Log
- 2026-04-13: Ticket created.


