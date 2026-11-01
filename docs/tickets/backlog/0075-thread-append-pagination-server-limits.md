# Ticket 0075: Thread Append Pagination With Server-Owned Limits

## Status
- State: Planned
- Priority: Low
- Next: Resume API design after Ticket 0018 is complete.

## Dependencies
- [0018](../0018-thread-comment-lock-slowmode.md): Finish the active moderation controls and state work first, as prioritized by the user.

## Goal
Replace client-supplied thread depth and breadth values with server-owned pagination limits. Load additional direct replies and reply-chain segments through focused endpoints that append only the requested data.

## Requirements
- [ ] Initial thread loading uses server-defined limits and does not accept client-supplied depth or breadth values.
- [ ] Separate endpoints return bounded continuation slices for direct replies and reply chains, with validated continuation state.
- [ ] The client appends returned items without refetching or replacing already-loaded content.
- [ ] Pagination metadata stays outside the domain `Thread` type, and load-more indicators disappear when no further items are available.
- [ ] Tests cover initial bounds, both continuation flows, invalid or cross-thread cursors, end-of-data behavior, and duplicate-free appends.

## Tasks
- [ ] Define server-owned initial sizes, continuation batch sizes, maximums, and cursor/response contracts.
- [ ] Add a bounded direct-reply continuation endpoint with deterministic ordering and cursor validation.
- [ ] Add a bounded reply-chain continuation endpoint that validates the requested branch and returns whether more chain items exist.
- [ ] Update thread detail and reply components to request and append continuation slices while keeping cursor state local to the page.
- [ ] Add focused thread integration tests for cursor bounds, branch scoping, ordering, and append behavior.

## Notes
- Defer implementation until Ticket 0018 is complete.
- Preserve the current reply-chain behavior of following the highest-scoring child at each step unless product requirements change.
- Prefer opaque, validated cursors over exposing numeric depth and breadth controls to the client; server limits remain authoritative regardless of cursor contents.
- Keep the existing `thread:load_more` sentinel for list rendering; do not add pagination flags to `Thread` records.

## Relevant Files
- app/pages/thread/[id].vue
- app/pages/thread/components/ThreadReply.vue
- server/api/thread/[id]/index.ts
- server/assets/schema.surql
- shared/types/index.ts
- tests/parallel/threads.test.ts

## Progress Log
- 2026-10-30: Ticket created.