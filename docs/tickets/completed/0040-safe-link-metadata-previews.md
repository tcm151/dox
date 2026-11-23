# Ticket 0040: Safe Link Metadata Previews

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Generate a simple, best-effort preview from public HTTP or HTTPS pages without exposing internal services or consuming unbounded server resources. A page title and description are the core preview; canonical URL and image metadata are optional enhancements.

## Requirements
- [x] Link previews can resolve a page title and description when available; canonical URL and representative image are optional.
- [x] Support common HTML metadata, Open Graph, Twitter Cards, Schema.org JSON-LD/microdata, and JSON oEmbed discovery.
- [x] Fetches reject private or reserved network targets and revalidate every redirect destination.
- [x] Fetches enforce protocol, timeout, redirect, response-size, and content-type limits.
- [x] Missing, malformed, or unreachable metadata falls back to the submitted link without blocking publication.
- [x] Preview metadata has a documented refresh and caching policy.

## Tasks
- [x] Run preview lookup on URL blur and during publication; cache results in memory for ten minutes, with a 256-entry cap.
- [x] Implement a focused server utility for constrained HTTP and HTTPS metadata retrieval.
- [x] Parse basic HTML title and description metadata with deterministic precedence.
- [x] Add an authenticated preview endpoint and connect it to the existing editor preview.
- [x] Render extracted title and description as text; do not render URL metadata without validation.
- [x] Cover loopback, private address, redirect, oversized response, timeout-style failure, malformed HTML, and successful preview cases.
- [x] Extract representative image metadata from HTML, structured data, and oEmbed, validating URLs before rendering them.

## Notes
- The Link contract and publication path are complete in Ticket 0039.
- Remote fetching adds SSRF and resource-exhaustion risks; keep all network and response limits even for the simple preview.
- Publication must remain usable when metadata extraction fails.
- Canonical URL extraction is an optional enhancement and is not part of this completed ticket.

## Relevant Files
- app/pages/editor/link.vue
- app/pages/link/[id].vue
- shared/types/index.ts
- shared/utils/validation.ts
- server/api/link/preview.ts
- server/utils/LinkPreviewManager.ts
- server/middleware/protection.ts
- server/assets/schema.surql
- server/assets/migrations/2026.6.3.surql
- tests/parallel/link-preview.server.test.ts
- docs/API.md
- docs/Roadmap.md

## Progress Log
- 2026-11-14: Completed protocol, redirect, content-type, size, and absolute-deadline controls. A slow-trickle regression test verifies the request aborts at the deadline; the full suite passes.
- 2026-11-14: Added best-effort YouTube description extraction from the public player response with a 512-character description cap. YouTube pages use a bounded 2 MiB response limit so the player metadata can be reached beyond the generic 512 KiB prefix; verified the description renders in the editor.
- 2026-11-14: Review found the HTTP timeout is an inactivity timeout, not a hard end-to-end deadline; a slow-trickle response can exceed the intended request budget. Timeout enforcement remains open.
- 2026-11-13: Expanded metadata support to Schema.org JSON-LD/microdata and discovered JSON oEmbed endpoints. Large HTML pages now yield metadata from a bounded 512 KiB prefix; the BBC live article title, description, and image were verified in the editor. Focused preview tests pass (20/20) and typecheck passes.
- 2026-11-13: Added constrained YouTube oEmbed title lookup after the watch page exceeded the 512 KB HTML cap. The provided link now returns and renders its video title in the editor; focused preview tests pass (12/12) and typecheck passes.
- 2026-11-13: Implemented and tested bounded title/description previews, authenticated lookup, editor integration, best-effort publication persistence, and ten-minute in-memory caching. Canonical URL and image extraction remain optional enhancements.
- 2026-11-13: Promoted to active work after the Link contract and publication path were implemented. Narrowed the preview to best-effort title and description extraction, with canonical URL and image metadata optional; SSRF and resource limits remain required.
- 2026-09-28: Ticket created.