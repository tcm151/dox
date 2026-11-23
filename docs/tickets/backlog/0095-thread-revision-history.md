# Ticket 0095: Thread Revision History

## Status
- State: Deferred
- Priority: Medium
- Next: Define author and moderator history views and restore permissions

## Dependencies
- [0093](0093-content-revision-history-foundation.md): Thread history views and restore actions require the shared revision contract and read paths.

## Goal
Let thread authors inspect prior revisions and authorized moderators review or restore a prior version without erasing history.

## Requirements
- [ ] Authors can inspect the revision history of their threads.
- [ ] Authorized moderators can review revisions according to the existing moderation boundary.
- [ ] Restoring a prior revision creates a new revision and preserves the intervening history.
- [ ] Missing, archived, or otherwise unavailable threads have safe, clear behavior.
- [ ] Thread history and restore paths have focused authorization and state tests.

## Tasks
- [ ] Build thread revision history and comparison views using Ticket 0093 read paths.
- [ ] Add moderator review access consistent with existing thread moderation permissions.
- [ ] Implement restore as a normal authorized edit that records a new revision.
- [ ] Add focused UI and server coverage for history, authorization, and restore behavior.

## Notes
- Do not rewrite or delete prior revision records when restoring content.

## Relevant Files
- app/pages/thread/[id].vue
- server/api/thread/
- server/utils/ModerationManager.ts
- tests/parallel/threads.server.test.ts

## Progress Log
- 2026-11-12: Ticket created.