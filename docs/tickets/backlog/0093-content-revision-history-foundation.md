# Ticket 0093: Content Revision History Foundation

## Status
- State: Planned
- Priority: Medium
- Next: Define immutable revision snapshots and retention behavior for posts and threads

## Goal
Create a shared, durable revision-history contract for posts and threads so later workflows can display, review, and restore prior content safely.

## Requirements
- [ ] Shared types and schema represent immutable post and thread revision snapshots with author and timestamp metadata.
- [ ] Editing a post or thread records its prior content consistently with the content update.
- [ ] Revision records cannot be changed through ordinary content edit APIs.
- [ ] Revision reads enforce the agreed author and moderator authorization rules.
- [ ] Schema migration and focused tests cover creation, edits, authorization, and unavailable content.

## Tasks
- [ ] Define captured fields, attribution, retention, and authorization behavior.
- [ ] Add revision types, schema, and migration.
- [ ] Capture revisions consistently from post and thread edit workflows.
- [ ] Add authorized revision-history read paths for the follow-up UI tickets.
- [ ] Test atomicity, immutability, migration behavior, and access control.

## Notes
- User-facing post and thread history, moderator review, and revert behavior are split into [Ticket 0094](0094-post-revision-history.md) and [Ticket 0095](0095-thread-revision-history.md).
- Topic rule history remains separate in [Ticket 0017](0017-topic-rules-history-page.md).

## Relevant Files
- shared/types/index.ts
- server/assets/schema.surql
- server/assets/migrations/
- server/api/post/
- server/api/thread/

## Progress Log
- 2026-11-12: Ticket created.