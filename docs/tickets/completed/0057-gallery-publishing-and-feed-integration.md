# Ticket 0057: Gallery Publishing and Feed Integration

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Make a group of uploaded images publish as one first-class gallery content item, while keeping image records as reusable media assets for gallery, post, and thread attachments.

## Requirements
- [x] Publishing an image group creates one gallery with its author, description, topics, timestamps, engagement fields, and image references; raw images do not appear as independent content feed items.
- [x] Galleries render as first-class items in popular and following feeds, including stable new, hot, and top sorting with pagination.
- [x] Galleries are discoverable from topic and user feeds and have a canonical detail page with visit, vote, and report behavior.
- [x] Image deletion is blocked while any gallery or other content references the image; gallery deletion and archival preserve media cleanup and topic lifecycle rules.
- [x] Focused integration coverage verifies publish permissions, gallery feed/detail behavior, topic relationships, and referenced-image retention and cleanup.

## Tasks
- [x] Add the shared Gallery type and finish the fresh-schema and migration contract, including migration of existing public image publications.
- [x] Change image publishing to create one gallery per submitted image group while retaining image assets for ordinary attachments.
- [x] Add gallery fields to the mixed-feed query and render gallery previews; remove raw images from content feed surfaces.
- [x] Add gallery detail, visit, report, and archive/delete routes using existing post/thread conventions.
- [x] Include galleries in topic and user feeds.
- [x] Include galleries in relevant discovery search results.
- [x] Update image cleanup guards and add integration tests for gallery-backed images and the publish lifecycle.

## Notes
- One publish operation creates one gallery; it is not a persistent user-managed collection.
- Keep the image table focused on uploaded media and attachment references. Gallery records own publication topics and feed engagement.
- Coordinate mixed-feed changes with [Ticket 0003](completed/0003-feed-home-pagination.md); that ticket already tracks stable pagination and mixed-content sorting.
- Reuse the media cleanup and high-risk route coverage work in [Ticket 0001](completed/0001-media-delete-atomicity.md), [Ticket 0052](completed/0052-image-attachment-ownership-and-refunds.md), and [Ticket 0022](completed/0022-contract-tests-high-risk-routes.md) rather than creating overlapping tickets.
- Image thumbnail work remains separately tracked in [Ticket 0036](0036-generate-image-thumbnails-on-upload.md).

## Relevant Files
- server/assets/schema.surql
- server/assets/migrations/2026.6.0.surql
- shared/types/index.ts
- server/api/gallery/publish.ts
- server/api/gallery/[id]/index.ts
- server/api/gallery/[id]/delete.ts
- server/api/feed/search.ts
- server/utils/mediaCleanup.ts
- server/utils/feedPagination.ts
- server/api/feed/search.ts
- server/api/topic/[topic]/feed.ts
- server/api/user/[id]/feed.ts
- app/components/system/previews/MultiPreview.vue
- app/components/system/previews/GalleryPreview.vue
- app/components/system/previews/MultiPreview.vue
- app/components/system/previews/SearchCommentPreview.vue
- app/pages/gallery/[id].vue
- app/pages/feed/images.vue
- app/pages/feed/home.vue
- tests/sequential/05-home-feed-pagination.test.ts
- tests/sequential/04-content-submissions.test.ts
- tests/sequential/06-topic-query-resilience.test.ts
- tests/parallel/search.test.ts

## Progress Log
- 2026-10-25: Added gallery owner deletion controls and integration coverage for publish ownership, detail/visit behavior, non-owner deletion, topic cleanup, image retention, and following-feed ordering across new/hot/top. `yarn test` and `yarn typecheck` pass.
- 2026-10-25: Added globally relevance-ordered search for posts, threads, galleries, and separate comment previews, with exact phrase priority. The full integration suite and typecheck pass; gallery deletion controls and following-feed/sort-order coverage remain.
- 2026-10-24: Rejected empty gallery publications and added focused coverage. Split sequential tests into content submissions (`04`), pagination/sorting (`05`), and topic-query resilience (`06`). Gallery search, owner-facing detail deletion, following-feed integration coverage, and exact sort-order assertions remain.
- 2026-10-24: Consolidated the current migration work into `2026.6.0`, including migration-tracking bootstrap, media schema changes, referral-claim index change, and gallery migration. Removed intermediate `2026.5.2`–`2026.5.4` files. Verified upgrade from a legacy database without migration tracking, data repair, and replay; `yarn test` and `yarn build` pass.
- 2026-10-24: Preserved legacy image topics on migrated galleries before removing the image topic field. Verified topic back-reference repair excludes soft-deleted posts and threads while retaining live relationships, and replay remains safe.
- 2026-10-24: Fixed thread deletion to unlink `topic.threads`; `2026.6.0` now rebuilds post/thread/gallery back-references from content records, excludes soft-deleted threads, and removes persisted image topics. Verified clean `2026.5.2` through `2026.6.0` migration and replay with stale soft-deleted thread data. Added a thread-deletion topic lifecycle regression; `yarn test` passes.
- 2026-10-24: Consolidated the unpublished 2026.5.5 and 2026.5.6 drafts into 2026.6.0. Verified the migration from the committed 2026.5.4 schema with legacy public-image data, including replay safety and topic back-references; `yarn test`, `yarn build`, and `git diff --check` pass. Empty-publish validation, gallery search, detail-page deletion controls, and focused lifecycle/feed integration coverage remain.
- 2026-10-24: Added the Gallery contract, publishing and lifecycle APIs, mixed/topic/user feeds, previews, and gallery reference cleanup. The sequential suite passes on a fresh schema. Search integration and detail-page deletion controls remain.
- 2026-10-24: Ticket created.
