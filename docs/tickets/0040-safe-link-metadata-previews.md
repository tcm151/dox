# Ticket 0040: Safe Link Metadata Previews

## Status
- State: Planned
- Priority: Medium
- Next: Document the metadata fields and network restrictions required for remote URL inspection.

## Dependencies
- [0039](0039-link-publishing-foundation.md): Metadata previews need the Link contract and publication path.

## Goal
Generate useful link previews without allowing remote metadata fetches to expose internal services or consume unbounded server resources.

## Requirements
- [ ] Link previews can resolve a title, description, canonical URL, and representative image when a remote page provides them.
- [ ] Fetches reject private or reserved network targets and revalidate every redirect destination.
- [ ] Fetches enforce protocol, timeout, redirect, response-size, and content-type limits.
- [ ] Missing, malformed, or unreachable metadata falls back to the submitted link without blocking publication.
- [ ] Preview metadata has a documented refresh and caching policy.

## Tasks
- [ ] Define the persisted preview metadata shape and whether extraction occurs before or after publication.
- [ ] Implement a focused server utility for constrained HTTP and HTTPS metadata retrieval.
- [ ] Parse standard HTML title, description, canonical, Open Graph, and image metadata with deterministic precedence.
- [ ] Add an authenticated preview endpoint and connect it to the existing editor preview.
- [ ] Sanitize returned metadata and validate remote image URLs before rendering them.
- [ ] Cover loopback, private address, redirect, oversized response, timeout, malformed HTML, and successful preview cases.

## Notes
- This is the rich link preview portion of Roadmap C4. It is separate from basic publishing because server-side URL fetching introduces SSRF and resource-exhaustion risks.
- Publication must remain usable when metadata extraction fails.

## Relevant Files
- app/pages/editor/link.vue
- shared/types/index.ts
- shared/utils/validation.ts
- server/middleware/protection.ts
- docs/Roadmap.md

## Progress Log
- 2026-09-28: Ticket created.
