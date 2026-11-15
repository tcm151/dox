# Ticket 0080: Content Save Actions

## Status
- State: Planned
- Priority: Medium
- Next: Define the supported content types and saved-state behavior

## Goal
Let users save and unsave eligible content from its detail and options surfaces, with clear saved-state feedback. Keep content saves distinct from saving or following user profiles.

## Requirements
- [ ] Supported content types and save semantics are explicit; unsupported targets do not expose a dead-end save action.
- [ ] Authenticated users can save and unsave eligible content with authorization and duplicate handling enforced server-side.
- [ ] Relevant menus and metadata show the current viewer's saved state and accurate save counts.
- [ ] Coverage verifies authorized saves, unauthenticated requests, repeated saves, and unsaves for each supported type.

## Tasks
- [ ] Define the eligible content types and whether comment saves are supported.
- [ ] Implement the save and unsave API and persistence behavior for the selected types.
- [ ] Wire the applicable content options menus and metadata to the saved state for the selected types.
- [ ] Add focused integration coverage for the supported types and failure cases.

## Notes
- User-profile save/subscription behavior is tracked separately in [Ticket 0058](completed/0058-user-awards-and-saved-subscriptions.md).
- Posts, threads, and galleries have `votes.saves` in the current schema. Comments inherit the save field in the shared TypeScript type, but the current comment schema does not define `votes.saves`; explicitly settle gallery and comment support before implementation.
- A saved-content listing is not assumed by this ticket; decide whether it is needed before expanding beyond save actions and state feedback.

## Relevant Files
- app/pages/post/components/ExtraOptions.vue
- app/pages/thread/components/ExtraOptions.vue
- app/pages/gallery/[id].vue
- app/components/system/ContentHeader.vue
- shared/types/index.ts
- server/assets/schema.surql
- tests/parallel/engagement.test.ts

## Progress Log
- 2026-11-09: Ticket created.