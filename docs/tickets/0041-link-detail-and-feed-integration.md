# Ticket 0041: Link Detail and Feed Integration

## Status
- State: Completed
- Priority: Medium
- Next: None

## Dependencies
- [0039](0039-link-publishing-foundation.md): Detail pages and feed previews need the Link contract and published records.

## Goal
Make published links readable, discoverable, and actionable through a canonical detail page and the same feed surfaces used by other content types.

## Requirements
- [x] Each published link has a canonical detail page with author, topics, content, destination, and moderation actions.
- [x] Link previews render correctly through `MultiPreview` without changing post, thread, or image rendering.
- [x] Public links can appear in applicable topic and aggregate feeds with stable sorting and pagination behavior.
- [x] Owners and authorized moderators can perform the documented link lifecycle actions.
- [x] The dedicated Links navigation entry follows `feeds.links`; link feed APIs remain unfiltered.

## Tasks
- [x] Build the link detail page with safe external-link behavior and metadata fallback states.
- [x] Add a compact reusable link preview and register it with `MultiPreview`.
- [x] Include links in the applicable feed queries and feed navigation settings.
- [x] Add owner deletion and generic report and vote actions consistent with other content types.
- [x] Define Link editing as description-only; the title and destination remain immutable after creation.
- [x] Validate detail loading, missing records, permissions, disabled settings, and mixed-feed rendering.

## Notes
- Optional metadata enrichment is handled by active [Ticket 0040](0040-safe-link-metadata-previews.md); it is not required for basic detail and feed rendering.
- Reuse the generic vote and report endpoints where their record-level authorization and schema assumptions hold.
- The `feeds.links` setting is reserved for dedicated Links navigation; link feed APIs remain unfiltered like other content APIs.

## Relevant Files
- app/components/system/previews/MultiPreview.vue
- app/components/system/previews/LinkPreview.vue
- app/pages/link/[id].vue
- app/pages/feed.vue
- server/api/link/add.ts
- server/api/link/[id].ts
- server/utils/feedPagination.ts
- server/api/topic/[topic]/feed.ts
- server/api/user/[id]/feed.ts
- server/api/feed/popular.ts
- server/api/report/send.ts
- server/api/vote/[id]/positive.ts
- tests/parallel/feed.browser.test.ts
- tests/parallel/links.server.test.ts
- tests/sequential/03-settings.setup.test.ts
- shared/types/index.ts

## Progress Log
- 2026-11-14: Completed the `/feed/links` page and `feeds.links`-gated navigation with browser coverage. Link detail, feed integration, lifecycle actions, and Link/Post/Gallery action parity are implemented and covered by the full suite.
- 2026-11-14: Added Link parity for award, archive, app/topic pins, moderation tags, locks, and slow mode. App pins enter the existing inactive admin-review queue; topic pins are immediately active. Archive transitions are now transactional for posts, galleries, and Links. Owner edit/delete, reporting, and voting are supported; title and URL remain creation-only. Dedicated Links navigation through `feeds.links` remains open.
- 2026-11-14: Link detail, compact preview, and aggregate/topic/user feed integration are implemented. Link feed APIs intentionally remain unfiltered by `feeds.links`.
- 2026-09-28: Ticket created.
