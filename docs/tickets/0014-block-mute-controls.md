# Ticket 0014: User And Topic Block/Mute Controls

## Status
- State: Planned
- Priority: Medium
- Next: Define user/topic block and mute semantics for the first release

## Goal
Let users reduce unwanted content by blocking or muting other users and topics through personal settings.

## Requirements
- [ ] Users can block or mute users and topics from the appropriate settings and profile surfaces.
- [ ] Feed, search, and inbox results respect user/topic settings consistently.
- [ ] Controls are reversible and easy to understand.

## Tasks
- [ ] Define user/topic block and mute behavior, including the distinction between hiding and blocking.
- [ ] Implement persistence and add/remove/list operations for user and topic targets.
- [ ] Integrate user/topic filtering into feed, search, and inbox query paths.

## Notes
- Keyword muting is a deferred extension tracked in [Ticket 0088](backlog/0088-keyword-mute-controls.md) because text matching has distinct semantics and query costs.

## Relevant Files
- app/pages/settings/preferences.vue
- app/pages/user/[id]/index.vue
- server/api/feed/search.ts
- shared/types/index.ts

## Progress Log
- 2026-04-13: Ticket created.
