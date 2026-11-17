# Ticket 0059: Gallery Feed Canonical Route

## Status
- State: Completed
- Priority: Low
- Next: None

## Goal
Use the singular `/feed/gallery` route for the gallery feed.

## Requirements
- [x] `/feed/gallery` loads the gallery feed and is used by the Galleries tab.
- [x] The old `/feed/images` route is removed without a compatibility redirect.
- [x] Gallery publishing and internal navigation use the canonical route.
- [x] The production build registers `/feed/gallery` and does not register `/feed/images`.

## Tasks
- [x] Move the gallery feed page to the canonical singular route and remove the old route.
- [x] Update feed tabs, gallery publishing navigation, and internal route references.
- [x] Verify the production build's generated route manifest.

## Notes
- Ticket 0057 introduced the gallery feed under `/feed/images`; this route was intentionally removed rather than preserved as an alias.
- No dedicated HTTP regression test was added by decision; the production build's generated route manifest was used to verify route registration.
- This concerns published gallery navigation, not uploaded image asset routes.

## Relevant Files
- app/pages/feed.vue
- app/pages/feed/gallery.vue
- app/pages/editor/image.vue

## Progress Log
- 2026-11-01: Moved the gallery feed to `/feed/gallery`, updated feed and publishing navigation, and removed `/feed/images`. `yarn typecheck` and `yarn build` passed; the generated route table contains only the canonical path. Per decision, no dedicated HTTP route test was added.
- 2026-10-25: Ticket created from the outstanding gallery feed route TODO.