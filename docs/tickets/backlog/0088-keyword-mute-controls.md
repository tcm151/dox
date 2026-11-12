# Ticket 0088: Keyword Mute Controls

## Status
- State: Planned
- Priority: Medium
- Next: Define keyword matching semantics and the initial supported surfaces

## Goal
Let users hide feed, search, and inbox content that matches keywords they choose to mute, without changing the published content.

## Requirements
- [ ] Users can add, edit, list, and remove muted keywords from settings.
- [ ] Matching behavior, including case and word-boundary handling, is documented and consistent.
- [ ] Matching content is filtered consistently from supported feed, search, and inbox results.
- [ ] Keyword preferences do not alter public content or another user's view, and are covered by focused tests.

## Tasks
- [ ] Define supported keyword syntax, normalization, and matching behavior.
- [ ] Persist and validate each user's muted keyword list.
- [ ] Add settings controls and apply filtering to the agreed query surfaces.
- [ ] Test matching boundaries, settings updates, and filtered results.

## Notes
- User and topic blocking/muting are tracked separately in [Ticket 0014](../0014-block-mute-controls.md).
- Keep keyword matching distinct from user/topic relationship checks; coordinate the settings UX with Ticket 0014.

## Relevant Files
- app/pages/settings/preferences.vue
- server/api/feed/search.ts
- shared/types/index.ts
- server/assets/schema.surql

## Progress Log
- 2026-11-12: Ticket created.