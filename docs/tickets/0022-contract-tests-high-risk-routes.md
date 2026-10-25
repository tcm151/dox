# Ticket 0022: Contract Tests For High-Risk Routes

## Status
- State: In Progress
- Priority: High
- Next: Add baseline media and moderation contract tests

## Dependencies
- [0026](../0026-ci-pipeline-baseline.md): Completion requires CI to run the contract tests reliably.

## Goal
Add tests around critical API contracts to catch regressions in auth, moderation, media, and vote/report flows.

## Requirements
- [ ] High-risk routes have baseline contract tests.
- [x] Tests validate status codes, auth gates, and key response fields.
- [x] CI runs contract tests reliably.

## Tasks
- [x] Define initial high-risk endpoint areas.
- [x] Implement example-user data and helpers.
- [x] Add initial contract assertions for success and failure cases.
- [ ] Add baseline media and moderation contract tests.

## Notes
- Current coverage: authentication/session reuse, posts, threads, galleries, reports, votes, feedback, user engagement, and topic resilience.
- Remaining high-risk areas for this ticket: media uploads and moderation actions.

## Relevant Files
- package.json
- server/api/profile/login.ts
- server/api/post/add.ts
- server/api/thread/[id]/reply.ts
- server/api/report/send.ts
- server/api/vote/[id]/positive.ts
- server/api/feedback/submit.ts
- server/api/topic/[topic]/reports.ts
- server/api/image/upload.ts
- tests/parallel/
- tests/sequential/

## Progress Log
- 2026-10-25: Added area-focused vote and feedback contract tests; follow-up coverage targets media and moderation routes.
- 2026-04-13: Ticket created.
