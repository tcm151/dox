# Ticket 0139: Improve Mobile Layout and Responsive Sizing

## Status
- State: `Planned`
- Priority: `Medium`
- Next: Define the supported viewport baseline and representative user journeys.

## Goal
Make ClassicForum's core workflows usable on phones and other narrow viewports by addressing layout, sizing, and overflow issues without regressing tablet and desktop behavior.

## Requirements
- [ ] A supported viewport baseline and representative routes are documented for responsive validation.
- [ ] At the selected small viewports, core pages have no unintended horizontal overflow, clipped content, overlapping controls, or inaccessible primary actions.
- [ ] Navigation, feeds, publishing and editing surfaces, settings, and dialogs adapt to narrow layouts while preserving their existing behavior.
- [ ] Changes preserve expected layouts at tablet and desktop viewports.
- [ ] Focused browser coverage verifies the affected workflows at the selected small viewports.

## Tasks
- [ ] Define the minimum supported viewport widths and select representative navigation, feed, publishing, and settings journeys.
- [ ] Inspect those journeys at the selected small viewports and record layout defects by impact and owning component.
- [ ] Fix high-impact shared sizing and layout problems, then address scoped page-specific issues using existing responsive patterns.
- [ ] Add browser regressions for the fixed issues and verify tablet and desktop layouts remain usable.

## Notes
- This ticket focuses on responsive layout and sizing, not a general accessibility audit; coordinate related findings with Ticket 0138.
- Feed loading, error, and empty-state behavior is tracked separately in Ticket 0115.
- Build on completed Ticket 0034, which covers editor viewport bounds, rather than duplicating that work.

## Relevant Files
- app/app.vue
- app/pages/feed.vue
- app/components/lists/Feed.vue
- app/pages/editor/
- app/pages/settings/
- app/components/
- app/assets/scss/
- tests/utils/browser-fixtures.ts
- tests/parallel/

## Progress Log
- 2026-11-19: Ticket created.
