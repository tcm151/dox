# Ticket 0120: Align Record Reference And Projection Types

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Make types describe actual record IDs, hydrated projections, and editor state rather than treating one value as both a string and a complete object. Recover useful compiler checks at the boundaries affected by explicit query projections.

## Requirements
- [x] Touched relationships distinguish stored record IDs from hydrated objects according to the actual endpoint contract.
- [x] Projected query results use accurate field shapes, reusing domain types through Pick or Omit where appropriate rather than asserting complete records.
- [x] Post/comment sorting no longer requires casting hydrated comments back to object-and-string intersections.
- [x] Editor state contains the editable fields it owns rather than fabricated persisted identity, vote, score, and relationship defaults.
- [x] Callers do not replace the problematic intersections with blanket casts or unions that weaken endpoints which always return one representation.
- [x] JSON response shapes, record-ID normalization, profile audience behavior, and schema storage remain unchanged.
- [x] Focused contract assertions and type checks cover the migrated relationship and projection boundaries.

## Tasks
- [x] Inventory object-and-string intersections and trace representative post, comment, thread, and author projections to their consumers.
- [x] Correct the smallest coherent group of relationship and response types, then update its callers.
- [x] Separate editable form state from complete persisted domain objects in affected editors.
- [x] Remove casts made unnecessary by the corrected types and verify returned fields against actual SQL selections.
- [x] Add response-shape assertions without introducing a redundant type for every local expression.

## Notes
- Post.user, Post.comments, Comment.context, and several other relationships currently use object-and-string intersections.
- The post detail handler explicitly projects author fields and comment objects, then casts sorted comments to an array of Comment-and-string intersections.
- The thread editor constructs a complete Thread with placeholder persisted fields and casts its author, while the newer link editor keeps direct editable state.
- Completed [0076](completed/0076-explicit-surrealql-field-projections.md) changed query projections; this follow-up aligns their TypeScript representations. Completed [0074](completed/0074-surrealdb-record-references.md) concerns database reference ownership, not this type distinction.
- Keep profile access represented by User.visible; do not introduce a separate UserProfile type as part of this cleanup.
- Shared write contracts remain under [0119](0119-align-client-mutation-payloads-with-api-contracts.md). Do not require a repository-wide type rewrite before improving one boundary.

## Relevant Files
- shared/types/index.ts
- shared/utils/records.ts
- server/api/post/[id]/index.ts
- server/api/post/index.ts
- app/pages/editor/post.vue
- app/pages/editor/thread.vue
- app/pages/editor/link.vue
- app/pages/post/components/CommentSection.vue

## Progress Log
- 2026-11-17: Ticket created from the developer consistency review. Types and runtime payloads were inspected statically only.
- 2026-11-18: Added explicit post feed/detail and comment projection contracts, represented stored draft references as string IDs, removed unnecessary sorting casts, and reduced post/thread editor state to the fields each form owns. `yarn.cmd typecheck`, `yarn.cmd test --file posts.server.test.ts` (20/20), and `git diff --check` passed.
