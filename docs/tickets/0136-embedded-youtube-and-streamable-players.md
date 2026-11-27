# Ticket 0136: Embedded YouTube and Streamable Players

## Status
- State: `Planned`
- Priority: `Medium`
- Next: Define supported provider URL forms and player loading behavior.

## Goal
Let readers play supported YouTube and Streamable links within ClassicForum's link detail and preview surfaces, while preserving safe fallbacks to the original destination.

## Requirements
- [ ] Recognized YouTube and Streamable video links display responsive embedded players on link detail pages and link previews.
- [ ] Embed URLs are generated only from validated, supported provider hosts and video identifiers; provider-supplied HTML and arbitrary iframe URLs are never rendered.
- [ ] Third-party player content is loaded only after an explicit reader action, and unsupported or unavailable embeds retain a working link to the original destination.
- [ ] Player controls and activation are keyboard accessible, and unrelated link previews continue to render as before.
- [ ] Focused tests cover supported URL forms, invalid or spoofed hosts, fallback behavior, and rendering on detail and preview surfaces.

## Tasks
- [ ] Define supported YouTube and Streamable URL forms, player activation UX, and fallback behavior.
- [ ] Add a strict provider URL parser that derives trusted embed URLs without accepting arbitrary iframe markup.
- [ ] Integrate responsive, click-to-load players with the shared Link preview and detail experiences.
- [ ] Add focused server and browser coverage for URL parsing, accessibility, provider failures, and unaffected non-video links.

## Notes
- Completed Ticket 0040 extracts link metadata but does not render video players; completed Ticket 0041 provides the Link detail and feed surfaces.
- Deferred Ticket 0046 explicitly places rich external video embeds with link previews; hosted video uploads and playback remain out of scope here.

## Relevant Files
- app/components/system/previews/LinkPreview.vue
- app/components/system/previews/MultiPreview.vue
- app/pages/link/[id].vue
- app/utils/markdown.ts
- server/utils/LinkPreviewManager.ts
- tests/parallel/links.server.test.ts
- tests/parallel/feed.browser.test.ts

## Progress Log
- 2026-11-19: Ticket created.
