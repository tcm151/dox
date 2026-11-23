# Ticket 0119: Align Client Mutation Payloads With API Contracts

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Carry meaningful request contracts through both client payload construction and server parsing. Stop older editors from constructing database-shaped payloads for fields the server already owns.

## Requirements
- [x] Post, thread, and draft creation use explicit multi-field request contracts shared by their actual callers and handlers where useful.
- [x] Client payloads omit server-owned identity, timestamps, initial votes, and computed relationships that are not accepted request fields.
- [x] Payload construction is checked against the endpoint contract rather than relying only on a generic response type.
- [x] One-off single-field bodies remain inline at readBody; trivial aliases and a separate interface for every route are not introduced.
- [x] Existing endpoint paths, response shapes, authenticated ownership, defaults, and publication behavior remain unchanged.
- [x] Type checks catch invalid field types and excess request fields; API and browser tests retain the supported publication and draft workflows.

## Tasks
- [x] Inventory request fields read by post, thread, and draft handlers and compare their editor callers.
- [x] Reuse or extract meaningful shared write contracts without coupling them to complete persisted domain objects.
- [x] Type client payload construction with those contracts and remove ignored server-owned fields.
- [x] Review the one-field gallery and link edit request aliases against the existing inline-body convention.
- [x] Validate publication, replies, attachments, and draft save/update contracts with focused coverage.

## Notes
- The post editor sends user, time, votes, and comments fields outside CreatePostRequest. The thread editor similarly supplies user and votes outside CreateThreadRequest.
- useApi's generic currently expresses the response; adding a response annotation alone does not make these editor objects a shared request contract.
- Prefer straightforward typed objects or satisfies checks before extending the request helper or introducing generated route registries.
- Server-side runtime validation remains necessary and is tracked separately in Ticket 0121.
- Coordinate with projected/form types in Ticket 0120 and workflow placement in Ticket 0124; these are related work, not prerequisites.

## Relevant Files
- app/utils/data.ts
- app/pages/editor/post.vue
- app/pages/editor/thread.vue
- server/api/post/add.ts
- server/api/thread/add.ts
- server/api/profile/drafts/add.ts
- server/api/profile/drafts/[id]/update.ts
- server/api/gallery/[id]/edit.ts
- server/api/link/[id]/edit.ts
- shared/types/
- tests/parallel/account.server.test.ts
- tests/parallel/editor.browser.test.ts

## Progress Log
- 2026-11-19: Added shared write contracts and checked client payloads with `satisfies`; removed ignored/server-owned fields and inlined one-field edit bodies. Draft API and editor browser tests passed. The full suite reported unrelated freshness and topic-moderator browser failures; typecheck reported existing errors in topic tool pages.
- 2026-11-17: Ticket created from the developer consistency review. No executable validation was performed.
