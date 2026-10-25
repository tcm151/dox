# Ticket 0022: Contract Tests For High-Risk Routes

## Status
- State: Completed
- Priority: High
- Next: None

## Dependencies
- [0026](0026-ci-pipeline-baseline.md): Completion requires CI to run the contract tests reliably.

## Goal
Add tests around critical API contracts to catch regressions in auth, moderation, media, and vote/report flows.

## Requirements
- [x] High-risk routes have baseline contract tests.
- [x] Tests validate status codes, auth gates, and key response fields.
- [x] CI runs contract tests reliably.

## Tasks
- [x] Define initial high-risk endpoint areas.
- [x] Implement example-user data and helpers.
- [x] Add initial contract assertions for success and failure cases.
- [x] Add baseline media and moderation contract tests.

## Notes
- Coverage includes authentication/session revocation, posts, threads, galleries, reports, votes, feedback, user engagement, topic resilience, image uploads, and moderation requests.
- Migration coverage remains out of scope because it is specific to the migration version under test.

## Relevant Files
- package.json
- server/api/profile/login.ts
- server/api/post/add.ts
- server/api/thread/[id]/reply.ts
- server/api/report/send.ts
- server/api/vote/[id]/positive.ts
- server/api/feedback/submit.ts
- server/api/image/upload.ts
- server/api/moderator/request/[id]/approve.ts
- server/api/moderator/request/[id]/deny.ts
- server/api/topic/[topic]/reports.ts
- server/utils/database.ts
- tests/parallel/feedback.test.ts
- tests/parallel/media.test.ts
- tests/parallel/moderation.test.ts
- tests/parallel/user-engagement.test.ts
- tests/parallel/votes.test.ts
- tests/parallel/
- tests/sequential/

## Progress Log
- 2026-10-25: Added concurrent and insufficient-balance award checks, session revocation, image upload/attachment cleanup, and moderation request authorization/decision coverage. Centralized bounded transaction conflict retries in DatabaseQuery; full test suite and typecheck pass.
- 2026-10-25: Added area-focused vote and feedback contract tests; follow-up coverage targets media and moderation routes.
- 2026-04-13: Ticket created.
