# Ticket 0017: Topic Rules And History Page

## Status
- State: Todo
- Priority: Low
- Next action: Decide page route and minimal rules schema

## Goal
Provide a topic-level rules/summary page with revision history to improve clarity and moderation transparency.

## Done Looks Like
- [ ] Topic has a dedicated rules/summary view.
- [ ] Rules changes are versioned with timestamps.
- [ ] Users can see current rules and recent changes.

## Tasks
- [ ] Define topic rules storage format and history behavior.
- [ ] Add API endpoints for read/update/version list.
- [ ] Build topic page UI for display and edits (moderator-gated).

## Notes

## Relevant Files
- [app/pages/topic/[topic]/index.vue](../../app/pages/topic/[topic]/index.vue)
- [app/pages/topic/[topic]/profile.vue](../../app/pages/topic/[topic]/profile.vue)
- [server/api/topic/[topic]/index.ts](../../server/api/topic/[topic]/index.ts)
- [server/api/topic/[topic]/update.ts](../../server/api/topic/[topic]/update.ts)

## Progress Log
- 2026-04-13: Ticket created.


