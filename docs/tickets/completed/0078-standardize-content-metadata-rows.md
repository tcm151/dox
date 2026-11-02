# Ticket 0078: Standardize Content Metadata Rows

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Replace duplicated tag and metadata rows in content previews and detail pages with one reusable component. The component should render the metadata applicable to the content it receives while supporting the different density needs of preview and detail contexts.

## Requirements
- [x] A shared component renders consistent, responsive metadata rows for supported preview and detail content types.
- [x] The row derives applicable items from a typed content input, including available votes, author, topics, moderation state, visit and reply counts, and publication time; missing optional values are omitted, while supported discussion counts display `0` when empty.
- [x] Preview and detail contexts can use the shared component without losing their appropriate layout density or content-specific moderation behavior.
- [x] Existing preview and detail surfaces for posts, threads, galleries, and images render the correct metadata after migration.
- [x] Reviewed all supported types and both display contexts; Nuxt typecheck passes. No browser/component test suite was added by decision.

## Tasks
- [x] Audit current metadata rows and define a typed content and display-context API for the shared component.
- [x] Implement the reusable component using existing tag, vote, user, topic, moderation, and time components.
- [x] Migrate applicable preview and detail pages, removing duplicated row composition.
- [x] Review optional metadata variations and preview/detail presentation; validate with Nuxt typecheck.

## Notes
- The thread preview and thread detail page previously composed similar metadata with different layout classes and tag variants.
- Content-specific actions remain with their existing slots. Post, thread, and gallery moderation display is part of `ContentHeader`; comment and reply moderation keeps the standalone component.
- No dedicated browser or component test was added, per decision; the current repository has no browser test suite.

## Relevant Files
- app/components/system/ContentHeader.vue
- app/components/system/ModerationState.vue
- app/components/system/tags/Tag.vue
- app/components/system/tags/TopicTag.vue
- app/components/system/previews/ThreadPreview.vue
- app/components/system/previews/PostPreview.vue
- app/components/system/previews/GalleryPreview.vue
- app/components/system/previews/ImagePreview.vue
- app/pages/thread/[id].vue
- app/pages/post/[id].vue
- app/pages/gallery/[id].vue
- app/pages/image/[id].vue
- shared/types/index.ts

## Progress Log
- 2026-11-01: Kept metadata order and coloring consistent across preview/detail, and ensured empty discussion collections display `0`. Nuxt typecheck passes.
- 2026-11-01: Consolidated content metadata and moderation state in `ContentHeader` across four preview and four detail surfaces. Nuxt typecheck passes. Browser/component test coverage was intentionally skipped; no test file was added.
- 2026-11-01: Ticket created.