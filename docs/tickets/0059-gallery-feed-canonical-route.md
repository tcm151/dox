# Ticket 0059: Gallery Feed Canonical Route

## Status
- State: Planned
- Priority: Low
- Next: Add a compatibility route from `/feed/images` to the canonical gallery feed.

## Goal
Use a route that matches the gallery feed's user-facing name while preserving existing links and navigation state.

## Requirements
- [ ] `/feed/galleries` loads the gallery feed and is used by the Galleries tab.
- [ ] `/feed/images` redirects to `/feed/galleries` so existing links continue to work.
- [ ] Gallery publishing and internal navigation use the canonical route.
- [ ] Route behavior is covered by a focused test.

## Tasks
- [ ] Add the canonical gallery feed route and legacy redirect.
- [ ] Update feed tabs, gallery publishing navigation, and internal route references.
- [ ] Add focused route coverage and update relevant documentation.

## Notes
- Ticket 0057 added the gallery feed under `/feed/images`; preserve this path as a compatibility redirect.
- This concerns published gallery navigation, not uploaded image asset routes.

## Relevant Files
- app/pages/feed.vue
- app/pages/feed/images.vue
- app/pages/editor/image.vue

## Progress Log
- 2026-10-25: Ticket created from the outstanding gallery feed route TODO.
