# Ticket 0119: Align Client Mutation Payloads With API Contracts

## Status
- State: Planned
- Priority: Medium
- Next: Compare post and thread editor payloads with their typed creation handlers.

## Goal
Carry meaningful request contracts through both client payload construction and server parsing. Stop older editors from constructing database-shaped payloads for fields the server already owns.

## Requirements
- [ ] Post, thread, and draft creation use explicit multi-field request contracts shared by their actual callers and handlers where useful.
- [ ] Client payloads omit server-owned identity, timestamps, initial votes, and computed relationships that are not accepted request fields.
- [ ] Payload construction is checked against the endpoint contract rather than relying only on a generic response type.
- [ ] One-off single-field bodies remain inline at readBody; trivial aliases and a separate interface for every route are not introduced.
- [ ] Existing endpoint paths, response shapes, authenticated ownership, defaults, and publication behavior remain unchanged.
- [ ] Type checks catch invalid field types and excess request fields; API and browser tests retain the supported publication and draft workflows.

## Tasks
- [ ] Inventory request fields read by post, thread, and draft handlers and compare their editor callers.
- [ ] Reuse or extract meaningful shared write contracts without coupling them to complete persisted domain objects.
- [ ] Type client payload construction with those contracts and remove ignored server-owned fields.
- [ ] Review the one-field gallery and link edit request aliases against the existing inline-body convention.
- [ ] Validate publication, replies, attachments, and draft save/update contracts with focused coverage.

## Notes
- The post editor sends user, time, votes, and comments fields outside CreatePostRequest. The thread editor similarly supplies user and votes outside CreateThreadRequest.
- useApi's generic currently expresses the response; adding a response annotation alone does not make these editor objects a shared request contract.
- Prefer straightforward typed objects or satisfies checks before extending the request helper or introducing generated route registries.
- Server-side runtime validation remains necessary and is tracked separately in [0121](0121-unify-shared-validation-rules-and-boundaries.md).
- Coordinate with projected/form types in [0120](0120-align-record-reference-and-projection-types.md) and workflow placement in [0124](0124-align-complex-routes-with-domain-workflows.md); these are related work, not prerequisites.

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

## Progress Log
- 2026-11-17: Ticket created from the developer consistency review. No executable validation was performed.
