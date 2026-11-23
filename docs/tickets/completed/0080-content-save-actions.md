# Ticket 0080: Content Save Actions

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Let users save and unsave eligible content from its detail and options surfaces, with clear saved-state feedback. Keep content saves distinct from saving or following user profiles.

## Requirements
- [x] Posts, links, threads, and galleries support content saves; comments, audio, images, and user profiles do not expose this content-save action.
- [x] Authenticated users can save and unsave eligible content with authorization and duplicate handling enforced server-side.
- [x] Relevant menus and metadata show the current viewer's saved state and accurate save counts.
- [x] Coverage verifies saves, unauthenticated requests, repeated saves, unsupported targets, and unsaves for each supported type.

## Tasks
- [x] Define the eligible content types: posts, links, threads, and galleries; comment saves are not supported.
- [x] Implement authenticated, idempotent save and unsave API operations for the selected types.
- [x] Wire the applicable content options menus and metadata to the saved state for the selected types.
- [x] Add focused integration coverage for the supported types and failure cases.

## Notes
- User-profile save/subscription behavior is tracked separately in Ticket 0058.
- Eligible content types already define `votes.saves` in the current schema and use the shared options menu. Comments lack the persisted save field; audio has a field but no corresponding content options surface and is outside this scope.
- A saved-content listing is not assumed by this ticket; decide whether it is needed before expanding beyond save actions and state feedback.

## Relevant Files
- app/components/system/ExtraOptions.vue
- app/components/system/ContentHeader.vue
- shared/types/index.ts
- server/utils/ContentManager.ts
- server/api/vote/[id]/save.ts
- server/api/vote/[id]/unsave.ts
- docs/API.md
- tests/parallel/engagement.server.test.ts
- tests/parallel/engagement.browser.test.ts

## Progress Log
- 2026-11-16: Completed idempotent content saves for posts, links, threads, and galleries; focused server/browser tests and typecheck pass. The full suite still has an intermittent search scroll-restoration failure under concurrent browser load.
- 2026-11-16: Defined post, link, thread, and gallery saves; excluded comments, audio, images, and user profiles from this content-save action.
- 2026-11-09: Ticket created.