# Ticket 0077: Recursive Thread Chain Locks

## Status
- State: Planned
- Priority: Medium
- Next: Define the chain-lock contract and bounded ancestor semantics.

## Dependencies
- [0018](completed/0018-thread-comment-lock-slowmode.md): Complete local thread lock and slow-mode moderation controls first.

## Goal
Allow moderators to apply a lock to a thread and its descendants without changing local item-lock behavior. Make inherited lock state visible and enforce it consistently for descendant replies and quotes.

## Requirements
- [ ] A chain lock blocks new replies to the locked thread and all of its descendants.
- [ ] A chain lock blocks quotes targeting the locked thread or any descendant.
- [ ] Thread surfaces distinguish local locks from inherited chain locks.
- [ ] Traversal is bounded and detects corrupt cyclic reply chains without affecting unrelated branches.
- [ ] Integration tests cover direct and descendant replies, quotes, inherited state, depth bounds, and cycles.

## Tasks
- [ ] Define the moderator control contract for selecting local versus chain scope.
- [ ] Implement bounded ancestor checks for replies and quotes.
- [ ] Project local and inherited lock state into thread responses and moderator controls.
- [ ] Add focused integration tests and validate schema/migration compatibility.

## Notes
- Ticket 0018 currently supports item-only thread locks and root-thread slow mode.
- Keep thread pagination limits and load-more behavior under Ticket 0075.
- Consider the computation-depth constraints captured by Ticket 0076 when selecting related thread records.

## Relevant Files
- app/components/system/ModerationControls.vue
- app/components/system/ModerationState.vue
- app/pages/thread/[id].vue
- app/pages/thread/components/ThreadReply.vue
- server/api/thread/[id]/index.ts
- server/api/thread/[id]/quote.ts
- server/api/thread/[id]/reply.ts
- server/assets/schema.surql
- server/utils/ModerationManager.ts
- tests/parallel/threads.test.ts

## Progress Log
- 2026-11-01: Ticket created.