# Ticket 0014: Block And Mute Controls

## Status
- State: Todo
- Priority: Medium
- Next action: Define first-pass block targets (users/topics/keywords)

## Goal
Let users reduce unwanted content by managing personal block and mute settings.

## Done Looks Like
- [ ] Users can block/mute supported targets from settings/profile surfaces.
- [ ] Feed/search/inbox respect block/mute settings.
- [ ] Controls are reversible and easy to understand.

## Tasks
- [ ] Define data model for blocked entities.
- [ ] Implement APIs for add/remove/list actions.
- [ ] Integrate filtering into feed/query paths.

## Notes

## Relevant Files
- [app/pages/settings/preferences.vue](../../app/pages/settings/preferences.vue)
- [app/pages/user/[id]/index.vue](../../app/pages/user/[id]/index.vue)
- [server/api/feed/search.ts](../../server/api/feed/search.ts)
- [shared/types/index.ts](../../shared/types/index.ts)

## Progress Log
- 2026-04-13: Ticket created.


