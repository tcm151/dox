# Ticket 0144: Improve the Topic Sidebar on Mobile

## Status
- State: Planned
- Priority: Medium
- Next: Identify an existing responsive pattern for showing topic details on narrow screens.

## Goal
Make topic details and actions available on narrow screens without changing the desktop sidebar layout. Use one shared component for both layouts.

## Requirements
- [ ] On narrow screens where the sidebar is hidden today, users can reach the locked status, moderator list, related topics, and rules when present.
- [ ] On desktop, topic details and actions remain in the sidebar beside the feed.
- [ ] Profile and Request Moderator keep their existing visibility and behavior in both layouts.
- [ ] When rules are present, users can expand and collapse them using a keyboard-accessible control.

## Tasks
- [ ] Extract the sidebar content into a reusable topic details component.
- [ ] Render that component in the desktop sidebar and make it accessible on narrow screens without duplicating markup.
- [ ] Make the rules section collapsible and remove the resolved TODOs.
- [ ] Add focused browser coverage for mobile access to topic details, rules expansion, and desktop sidebar behavior.

## Notes
- The current sidebar is hidden at and below `$bp-tablet`. The page TODOs call for a reusable component and collapsible rules.
- This is a topic-page improvement related to the broader responsive work in Ticket 0139, not a dependency.

## Relevant Files
- app/pages/topic/[topic]/index.vue

## Progress Log
- 2026-11-23: Ticket created.
