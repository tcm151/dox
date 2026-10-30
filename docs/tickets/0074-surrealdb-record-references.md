# Ticket 0074: Adopt SurrealDB Record References

## Status
- State: In Progress
- Priority: Medium
- Next: Verify REFERENCE behavior against supported SurrealDB versions

## Goal
Evaluate and adopt SurrealDB record references for cross-table relationships that are currently duplicated in manually maintained record lists. Preserve existing behavior while clarifying relationship ownership, traversal, and deletion semantics.

## Requirements
- [x] Manually maintained cross-table lists and their create, update, and delete paths are inventoried; each is selected for conversion or documented as intentionally unchanged.
- [x] Converted relationships use native references and computed incoming traversal where appropriate, with target-existence and deletion behavior explicitly defined.
- [x] Fresh schema and a forward migration preserve existing relationships, and migration replay is safe.
- [x] Updated API and shared-type consumers retain the required relationship context, with integration coverage for traversal and deletion behavior.

## Tasks
- [x] Inventory relationship lists and their readers/writers, including topic content lists, post comments, and thread replies/quotes.
- [x] Choose the source of truth, reverse traversal shape, existence checks, and deletion policy for each selected relationship.
- [x] Update the fresh schema and add a versioned migration that safely transitions existing relationship data.
- [x] Update affected API queries, shared types, and tests; verify migration replay and lifecycle behavior.

## Notes
- SurrealDB's [record references documentation](https://surrealdb.com/docs/reference/query-language/language-primitives/record-references) supports top-level fields containing a record or array of records and computed incoming traversal with `<~`.
- `REFERENCE` does not validate that the target exists; its default deletion behavior is `IGNORE`. Select explicit existence and `ON DELETE` behavior where required.
- Thread `replyTo` and `quote` fields are the source of truth; `replies` and `quotes` are incoming computed fields. The 2026.6.2 migration must rebuild reference tracking for existing links because schema declaration alone does not backfill incoming traversal.
- Reply targets reject hard deletion while replies remain; quote targets unset quote links when deleted.
- `comment.context` is the source of truth for comments on posts and galleries; both `post.comments` and `gallery.comments` are incoming computed traversals. Hard deletion rejects while comments remain, matching the API's existing retention behavior.
- Topic `posts`, `threads`, and `galleries` are incoming computed traversals from each content record's `topics` references. Soft-deleting posts and threads clears `topics`; empty-topic cleanup runs after membership changes. Missing topic targets are auto-created by the content create events, and topic deletion rejects while content still references it.
- Ticket 0072 depends on this work before selecting the gallery comment target and reverse lookup contract.

## Relevant Files
- server/assets/schema.surql
- server/assets/migrations/
- server/utils/migrations.ts
- server/utils/ReportManager.ts
- server/api/comment/[id]/delete.ts
- server/api/post/[id]/delete.ts
- server/api/thread/[id]/delete.ts
- server/api/gallery/[id]/delete.ts
- shared/types/index.ts
- tests/parallel/galleries.test.ts
- tests/parallel/posts.test.ts
- tests/parallel/threads.test.ts
- tests/parallel/topics.test.ts
- tests/sequential/03.migrations.test.ts

## Progress Log
- 2026-10-29: Revisited topic membership after deciding soft-deleted posts and threads need not retain topic links. Converted topic content lists to incoming references, cleared links on soft deletion, and explicitly cleaned up empty topics across delete and moderation workflows. Verified migration replay and lifecycle behavior; next verify supported SurrealDB versions.
- 2026-10-29: Kept topic membership lists intentionally unchanged: soft deletion separates content `topics` from topic membership lists, which remain the source for topic counts and empty-topic cleanup. Inventory, schema/migration, and lifecycle work is complete; next verify supported SurrealDB versions.
- 2026-10-29: Converted post comments to `comment.post` references with computed `post.comments`; removed the cache-maintenance event and delete-side mutation. Validated fresh-schema lifecycle and replayed the forward migration twice from `v2026.6.1`; topic membership remains pending its auto-create and cleanup contract.
- 2026-10-29: Unified post and gallery comment ownership under `comment.context`, with computed incoming traversal on both target tables.
- 2026-10-29: Tagged `v2026.6.1`; converted thread replies and quotes to record references in `2026.6.2`. Validated fresh schema, migration replay, target validation, and deletion behavior; next inventory topic membership and post-comment relations.
- 2026-10-29: Ticket created.