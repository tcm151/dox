# Ticket 0106: Consolidate Shared Target Actions

## Status
- State: Planned
- Priority: Medium
- Next: Inventory report, award, visit, and similar target-specific routes for identical workflows.

## Dependencies
- [0014](completed/0014-block-mute-controls.md): Complete block enforcement in the affected award routes before consolidating them.

## Goal
Consolidate action workflows whose behavior is identical apart from the target record type, while keeping target-specific contracts and behavior explicit.

## Requirements
- [ ] Report, award, visit, and other truly equivalent actions reuse shared implementation for their target-independent work.
- [ ] Target-specific authorization, validation, state changes, and side effects remain intact.
- [ ] API paths, response shapes, and externally visible behavior remain unchanged.
- [ ] Tests cover the shared behavior across its target types and preserve target-specific differences.

## Tasks
- [ ] Inventory target-specific action routes and document where their behavior is identical or differs.
- [ ] Consolidate only equivalent workflows using the existing manager and query conventions.
- [ ] Add or update tests and API documentation for the consolidated actions.

## Notes
- Do not force a shared workflow where authorization, validation, transitions, or side effects materially differ.
- Report, award, and visit are initial candidates; include other actions only when their behavior matches apart from target type.

## Relevant Files
- server/utils/ReportManager.ts
- server/api/image/[id]/report.ts
- server/api/gallery/[id]/report.ts
- server/api/post/[id]/report.ts
- server/api/user/[id]/award.ts
- server/api/post/[id]/award.ts
- server/api/thread/[id]/award.ts
- server/api/comment/[id]/award.ts
- server/api/gallery/[id]/award.ts
- server/api/link/[id]/award.ts
- server/api/user/[id]/visit.ts
- server/api/topic/[topic]/visit.ts
- server/api/post/[id]/visit.ts
- server/api/thread/[id]/visit.ts
- server/api/gallery/[id]/visit.ts
- server/api/link/[id]/visit.ts
- docs/API.md
- tests/parallel/reports.server.test.ts
- tests/parallel/engagement.server.test.ts

## Progress Log
- 2026-11-16: Ticket created.
