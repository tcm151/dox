# Ticket 0065: Expand Moderation-Adjacent Abuse Protections

## Status
- State: Completed
- Priority: High
- Next: None

## Dependencies
- [0064](0064-anti-spam-defaults.md): Baseline anti-spam values should guide enforcement limits.

## Goal
Apply appropriate rate limits and abuse protections to moderation-adjacent write paths, including report submission and report handling.

## Requirements
- [x] In-scope write paths have documented, server-enforced abuse limits.
- [x] Limits use the established request identity and rate-limit mechanisms.
- [x] Tests cover allowed requests, rejected excess requests, and authorization boundaries.

## Tasks
- [x] Inventory moderation-adjacent write endpoints and existing protections.
- [x] Add or adjust rate limits and abuse checks for uncovered paths.
- [x] Add focused tests for the protections and authorization behavior.

## Notes
- Generic, post, gallery, and image report submissions share a five-per-minute client-address budget.
- Report list routes are read-only and role-gated. Global report updates are admin-only; topic-scoped updates allow admins and assigned moderators after verifying topic membership. Moderator request approval/denial routes are role-gated and reject duplicate actions.
- Post and thread creation remain outside this ticket's report-submission scope.

## Relevant Files
- server/middleware/protection.ts
- server/api/report/send.ts
- server/api/post/[id]/report.ts
- server/api/gallery/[id]/report.ts
- server/api/image/[id]/report.ts
- tests/parallel/reports.test.ts
- tests/parallel/moderation.test.ts
- tests/sequential/03.migrations.test.ts
- server/assets/migrations/2026.6.1.surql

## Progress Log
- 2026-10-26: Separated report-submission rate limits from admin queue reads so refreshing `/api/report` no longer consumes the submission budget. Regression coverage verifies queue visibility, repeated-subject aggregation, and cross-route limiting; `yarn test` passes all seven phases and `yarn typecheck` passes.
- 2026-10-25: Unified report submissions under one client-address rate limit and added cross-route regression coverage. The `2026.6.1` migration consolidates existing submissions for replay testing; `yarn test` passes all seven phases and `yarn typecheck` passes.
- 2026-10-25: Audited report and moderation routes; report queues are read-only, while moderator request actions already enforce roles and reject duplicate votes.
- 2026-10-25: Ticket created.