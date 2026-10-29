# Ticket 0072: Add Comments to Galleries

## Status
- State: Planned
- Priority: Medium
- Next: Complete Ticket 0074 before defining the gallery comment relationship contract

## Dependencies
- [0074](0074-surrealdb-record-references.md): Establish the cross-table relationship approach before choosing the comment target and reverse lookup model.

## Goal
Give galleries the same commenting and reply capabilities as posts, using the existing comment experience where practical.

## Requirements
- [ ] Users can add comments to a gallery.
- [ ] Users can reply to gallery comments, and replies are displayed in the gallery discussion.
- [ ] Gallery comments follow the existing post-comment behavior for display, ordering, and author actions.
- [ ] Comment ownership and gallery context are returned consistently by the API.

## Tasks
- [ ] Define how a comment references either a post or a gallery, and update the schema and shared types.
- [ ] Extend comment creation and retrieval APIs to support gallery discussions.
- [ ] Add the comment section to the gallery detail page, reusing existing post-comment UI where appropriate.
- [ ] Add integration coverage for creating, retrieving, replying to, and deleting gallery comments.

## Notes
- Keep each comment's topic context derived from its containing post or gallery rather than duplicating topic associations on comments.
- Comment reporting is tracked separately in Ticket 0073.

## Relevant Files
- app/pages/gallery/[id].vue
- app/pages/post/components/CommentSection.vue
- server/api/comment/add.ts
- server/assets/schema.surql
- shared/types/index.ts

## Progress Log
- 2026-10-29: Ticket created.
