# Ticket 0106: Consolidate Shared Target Actions

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Consolidate action workflows whose behavior is identical apart from the target record type, while keeping target-specific contracts and behavior explicit.

## Requirements
- [x] Report, award, visit, and other truly equivalent actions reuse shared implementation for their target-independent work.
- [x] Target-specific authorization, validation, state changes, and side effects remain intact.
- [x] API paths, response shapes, and externally visible behavior remain unchanged.
- [x] Tests cover the shared behavior across its target types and preserve target-specific differences.

## Tasks
- [x] Inventory target-specific action routes and document where their behavior is identical or differs.
- [x] Consolidate only equivalent workflows using the existing manager and query conventions.
- [x] Add or update tests and API documentation for the consolidated actions.

## Notes
- Do not force a shared workflow where authorization, validation, transitions, or side effects materially differ.
- Report, award, and visit are initial candidates; include other actions only when their behavior matches apart from target type.
- Report submissions already share `ReportManager.create` across post, gallery, and image targets.
- User, topic, post, thread, gallery, and link visit routes have identical counter and response behavior; they now use `ContentManager` alongside shared content save actions.
- App-level archive toggles and pin creation for posts, links, threads, and galleries share `ContentManager`; topic-scoped pin management remains separate because it has different scope and permissions.
- User follow/unfollow updates the bidirectional follower graph, while topic follow/unfollow changes subscriptions; these workflows remain separate. Content-tag addition is already shared in `ModerationManager`.
- Award routes differ in target-topic derivation, user recipient token limits, notification wording, and response values; preserve those contracts while consolidating shared transaction behavior where practical.

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
- server/api/post/[id]/archive.ts
- server/api/thread/[id]/archive.ts
- server/api/gallery/[id]/archive.ts
- server/api/link/[id]/archive.ts
- server/api/post/[id]/pin.ts
- server/api/thread/[id]/pin.ts
- server/api/gallery/[id]/pin.ts
- server/api/link/[id]/pin.ts
- server/api/user/[id]/visit.ts
- server/api/topic/[topic]/visit.ts
- server/api/post/[id]/visit.ts
- server/api/thread/[id]/visit.ts
- server/api/gallery/[id]/visit.ts
- server/api/link/[id]/visit.ts
- server/utils/ContentManager.ts
- docs/API.md
- tests/parallel/reports.server.test.ts
- tests/parallel/engagement.server.test.ts
- tests/parallel/visits.server.test.ts
- tests/parallel/posts.server.test.ts
- tests/parallel/threads.server.test.ts

## Progress Log
- 2026-11-16: Extended shared actions to app-level archive toggles and pin creation across all four content targets while preserving the thread archive response. Audited follow/unfollow, topic pins, and content tags; the first two have distinct contracts, and tags are already shared. Validation: posts 22/22, threads 23/23, typecheck passed.
- 2026-11-16: Completed shared report, compatible content award, and visit workflows while preserving user-award policy differences and existing API contracts. Validation: reports 20/20, engagement server 18/18, engagement browser 2/2, visits 11/11, and typecheck passed.
- 2026-11-16: Completed the action inventory and consolidated the identical visit-counter handlers; report submissions already share `ReportManager.create`.
- 2026-11-16: Ticket created.
