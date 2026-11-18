# Ticket 0116: Include Published Links In Search

## Status
- State: Planned
- Priority: Low
- Next: Define link title and description ranking within the existing search contract.

## Goal
Make first-class published links discoverable through All types search and a dedicated Links type filter. Preserve shareable search URLs and the existing publication and personal-filter rules.

## Requirements
- [ ] Search can find active links by title and description, including an explicit link type filter.
- [ ] Link results work with topic, author, and date filters and existing URL synchronization.
- [ ] Quarantined, archived, deleted, muted, and blocked results follow the same applicable exclusion rules as other search content.
- [ ] Ranking and pagination remain deterministic across mixed content types.
- [ ] Existing MultiPreview rendering handles search link results without a separate incompatible domain type.
- [ ] API and browser tests cover Links and All types results, combined filters, exclusions, and history restoration.

## Tasks
- [ ] Add link search indexing where needed, projections, ranking expressions, and type validation.
- [ ] Add the Links option to the search UI and preserve query-string restoration.
- [ ] Extend existing search API and browser tests.
- [ ] Update the search API inventory and supported-type documentation.

## Notes
- This is a proposed product-polish expansion, not a regression against [0015](completed/0015-search-filters-url-sync.md), whose documented scope covers posts, threads, galleries, and comments.
- Links are already published and rendered through the detail/feed work in [0041](completed/0041-link-detail-and-feed-integration.md), and the shared SearchResult type already includes Link.
- Coordinate with query bounds in [0112](completed/0112-bound-discovery-and-inbox-queries.md); neither ticket needs to finish before the other's independent work can begin.

## Relevant Files
- server/api/feed/search.ts
- server/assets/schema.surql
- server/assets/migrations/
- app/pages/feed/search.vue
- app/components/system/previews/MultiPreview.vue
- shared/types/index.ts
- tests/parallel/search.server.test.ts
- tests/parallel/search.browser.test.ts
- docs/API.md

## Progress Log
- 2026-11-17: Ticket created from the public-launch source review as an optional discovery improvement.
