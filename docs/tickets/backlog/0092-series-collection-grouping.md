# Ticket 0092: Series and Collection Grouping

## Status
- State: Planned
- Priority: Medium
- Next: Define membership and ordering rules for post/thread series

## Goal
Allow authors to group related posts and threads into an ordered series or collection that readers can browse as a unit.

## Requirements
- [ ] The data model defines ownership, title/description, supported content types, and member ordering.
- [ ] Authors can create, edit, and remove a series and manage eligible post/thread membership.
- [ ] Readers can view a canonical series page and navigate between its members.
- [ ] Membership changes enforce ownership and do not alter the underlying content's publication or moderation state.
- [ ] Authorization, ordering, missing members, and mixed post/thread display have focused coverage.

## Tasks
- [ ] Define series and collection semantics, membership constraints, and deletion behavior.
- [ ] Add shared types, schema, and migration for series and ordered membership.
- [ ] Implement authorized create, update, membership, and read workflows.
- [ ] Build authoring controls and the canonical reader view.
- [ ] Add focused API and UI coverage for authorization and lifecycle states.

## Notes
- Start with user-owned, ordered groups of posts and threads; do not imply that membership changes content visibility or feed ranking.

## Relevant Files
- shared/types/index.ts
- server/assets/schema.surql
- app/pages/editor/
- app/pages/post/[id].vue
- app/pages/thread/[id].vue

## Progress Log
- 2026-11-12: Ticket created.