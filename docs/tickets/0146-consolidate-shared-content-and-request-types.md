# Ticket 0146: Consolidate Shared Content and Request Types

## Status
- State: Planned
- Priority: Medium
- Next: Inventory shared types by purpose: domain models, response projections, and API request payloads.

## Goal
Define a reusable `Content` type for code that handles multiple content kinds, organize shared declarations consistently, and give reusable API request interfaces their own file.

## Requirements
- [ ] A shared `Content` union represents `Post`, `Thread`, `Gallery`, `Link`, and `Comment` for `ExtraOptions` and other consumers that accept the same set. Consumers that accept a narrower set keep their narrower types.
- [ ] Shared declarations are grouped by purpose with consistent names and related declarations kept together.
- [ ] Reusable API request interfaces live in a dedicated file under `shared/types`; one-off single-field request bodies stay inline.
- [ ] Updated client and server imports type-check without new casts or changes to API payloads, response shapes, or runtime validation.

## Tasks
- [ ] Add `Content` and replace equivalent inline unions, starting with `ExtraOptions`.
- [ ] Group related declarations and align naming while preserving existing domain and projection boundaries.
- [ ] Move reusable request interfaces, including post, thread, and draft requests, into the dedicated file and update their imports.
- [ ] Run the TypeScript check and verify that the affected API contracts are unchanged.

## Notes
- Distinguish request payloads from persisted workflow records: `ModerationRequest` is a record, not an API request body.
- The newly introduced authenticated `Profile` projection is distinct from the stored/public `User` shape. Preserve that boundary while reorganizing declarations.
- Preserve the shared mutation contracts established in Ticket 0119. This ticket changes where they live, not what the endpoints accept.

## Relevant Files
- shared/types/index.ts
- app/components/system/ExtraOptions.vue
- server/api/post/add.ts
- server/api/thread/add.ts
- server/api/profile/drafts/add.ts
- server/api/profile/drafts/[id]/update.ts

## Progress Log
- 2026-11-23: Ticket created.
