# Ticket 0087: Extra Options Action Parity Across Content Types

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Review the shared Extra Options menu across posts, threads, galleries, and comments. Expand action support where the underlying APIs and authorization rules permit it, and reduce unexplained differences in availability and ordering.

## Requirements
- [x] Document which actions each content type supports and the applicable role or ownership rules.
- [x] Make supported actions available consistently where the API and authorization model allow, and record intentional exceptions.
- [x] Keep client-side action visibility aligned with server authorization and cover changed workflows with focused tests.
- [x] Use session-provided moderator topic assignments for client visibility while keeping server authorization authoritative.

## Tasks
- [x] Audit current action availability, route support, and authorization for each content type.
- [x] Add missing action support where appropriate and align the shared Extra Options UI.
- [x] Standardize action ordering and grouping across content types.
- [x] Add or update focused UI and server tests for the changed actions.
- [x] Replace the per-target moderation-access request with session moderator-topic data, including parent topic scope for comments.

## Notes
- This ticket follows the decision to expand action support where possible and revisit parity separately from the current tag workflow.
- Ticket 0067 covers broader moderation and messaging UI completeness, including thread archive controls; coordinate with it, but it is not a prerequisite.
- Preserve type-specific behavior where an action has no meaningful or authorized equivalent.
- Client visibility is a UX approximation: server routes remain authoritative for current item state, topic membership, and award constraints. Topic-pin visibility intentionally does not pre-check content status.

## Action Matrix
| Action | Post | Thread | Gallery | Comment |
| --- | --- | --- | --- | --- |
| Edit | Owner while unlocked | Owner while unlocked | Owner while unlocked | Owner while unlocked |
| Delete | Owner or admin | Owner or admin | Owner or admin | Owner or admin |
| Award | Any non-owner | Any non-owner | Any non-owner | Any non-owner |
| Report | Authenticated user | Authenticated user | Authenticated user | Authenticated user |
| Archive | Admin | Admin | Admin | Not supported |
| App pin | Admin | Admin | Admin | Not supported |
| Topic pin | Admin or assigned moderator | Admin or assigned moderator; top-level only | Admin or assigned moderator | Not supported |
| Lock | Admin or assigned moderator | Admin or assigned moderator | Admin or assigned moderator | Admin or assigned moderator |
| Slow mode | Admin or assigned moderator | Admin or assigned moderator | Admin or assigned moderator | Not supported |
| Tags | Admin or assigned moderator | Admin or assigned moderator | Admin or assigned moderator | Not supported |

Award routes enforce token balance, self-award, and duplicate-award rules. Comment moderation inherits the parent content's topic scope. Admins bypass topic assignment checks for topic-scoped actions. The menu uses the shared action order: pin, edit/delete, award, report, archive, moderation, tags.

## Relevant Files
- `app/components/system/ExtraOptions.vue`
- `app/pages/post/[id].vue`
- `app/pages/thread/[id].vue`
- `app/pages/gallery/[id].vue`
- `app/pages/post/components/CommentSection.vue`
- `server/utils/ModerationManager.ts`
- `server/utils/auth.ts`
- `shared/types/index.ts`
- `app/utils/session.ts`
- `docs/API.md`
- `server/api/comment/[id]/award.ts`
- `server/api/gallery/[id]/award.ts`
- `server/api/gallery/[id]/edit.ts`
- `server/api/report/send.ts`
- `server/api/post/[id]/tag/add.ts`
- `server/api/thread/[id]/tag/add.ts`
- `server/api/gallery/[id]/tag/add.ts`
- `tests/parallel/moderation.server.test.ts`

## Progress Log
- 2026-11-12: Completed the action matrix and shared action ordering, tightened moderator-role and topic-assignment visibility, and verified typecheck plus the full suite (124/124).
- 2026-11-12: Added session-derived moderator topic IDs, removed the Extra Options access probe, and validated comment/thread visibility; the full run still has a gallery options-trigger timeout.
- 2026-11-12: Ticket created.
