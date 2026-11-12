# Ticket 0087: Extra Options Action Parity Across Content Types

## Status
- State: Planned
- Priority: Medium
- Next: Inventory existing Extra Options actions and server authorization by content type

## Goal
Review the shared Extra Options menu across posts, threads, galleries, and comments. Expand action support where the underlying APIs and authorization rules permit it, and reduce unexplained differences in availability and ordering.

## Requirements
- [ ] Document which actions each content type supports and the applicable role or ownership rules.
- [ ] Make supported actions available consistently where the API and authorization model allow, and record intentional exceptions.
- [ ] Keep client-side action visibility aligned with server authorization and cover changed workflows with focused tests.

## Tasks
- [ ] Audit current action availability, route support, and authorization for each content type.
- [ ] Add missing action support where appropriate and align the shared Extra Options UI.
- [ ] Standardize action ordering and grouping across content types.
- [ ] Add or update focused UI and server tests for the changed actions.

## Notes
- This ticket follows the decision to expand action support where possible and revisit parity separately from the current tag workflow.
- Ticket 0067 covers broader moderation and messaging UI completeness, including thread archive controls; coordinate with it, but it is not a prerequisite.
- Preserve type-specific behavior where an action has no meaningful or authorized equivalent.

## Relevant Files
- `app/components/system/ExtraOptions.vue`
- `app/pages/post/[id].vue`
- `app/pages/thread/[id].vue`
- `app/pages/gallery/[id].vue`
- `app/pages/post/components/CommentSection.vue`
- `server/utils/ModerationManager.ts`
- `server/api/post/[id]/tag/add.ts`
- `server/api/thread/[id]/tag/add.ts`
- `server/api/gallery/[id]/tag/add.ts`
- `tests/parallel/moderation.server.test.ts`

## Progress Log
- 2026-11-12: Ticket created.
