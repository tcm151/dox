# Ticket 0072: Add Comments to Galleries

## Status
- State: In Progress
- Priority: Medium
- Next: Complete Ticket 0074's supported-version verification before closing the gallery comment relationship contract

## Dependencies
- [0074](0074-surrealdb-record-references.md): Verify record-reference behavior against supported SurrealDB versions before closing this ticket.

## Goal
Give galleries the same commenting and reply capabilities as posts, using the existing comment experience where practical.

## Requirements
- [x] Users can add comments to a gallery.
- [x] Users can reply to gallery comments, and replies are displayed in the gallery discussion.
- [x] Gallery comments follow the existing post-comment behavior for display, ordering, and author actions.
- [x] Comment ownership and gallery context are returned consistently by the API.

## Tasks
- [x] Define how a comment references either a post or a gallery, and update the schema and shared types.
- [x] Extend comment creation and retrieval APIs to support gallery discussions.
- [x] Add the comment section to the gallery detail page, reusing existing post-comment UI where appropriate.
- [x] Add integration coverage for creating, retrieving, replying to, and deleting gallery comments.

## Notes
- Keep each comment's topic context derived from its containing post or gallery rather than duplicating topic associations on comments.
- Comment reporting is tracked separately in Ticket 0073.

## Relevant Files
- app/pages/gallery/[id].vue
- app/pages/post/components/CommentSection.vue
- app/pages/post/components/ExtraOptions.vue
- server/api/comment/add.ts
- server/api/gallery/[id]/index.ts
- server/api/feed/search.ts
- server/assets/schema.surql
- server/assets/migrations/2026.6.2.surql
- shared/types/index.ts
- tests/parallel/galleries.test.ts
- tests/parallel/search.test.ts

## Progress Log
- 2026-10-29: Implemented gallery comments using the unified `comment.context` target and computed reverse traversal. Reused the post discussion and options UI, aligned gallery detail layout/actions with post detail, added gallery-aware comment search, and covered author/context, ordering, reply, edit, deletion, and reference protection. Browser checks passed at desktop and mobile widths; full integration suite passed 64/64. Remaining gate: Ticket 0074 supported-version verification.
- 2026-10-29: Ticket created.
