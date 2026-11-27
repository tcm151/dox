# Ticket 0139: Improve Mobile Layout and Responsive Sizing

## Status
- State: `In Progress`
- Priority: `Medium`
- Next: Confirm the minimum supported width and add regression cases for the clipped feed tabs and sort controls.

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
- In a desktop browser at 390 and 320 CSS pixels, the feed tab strip clipped tabs on both edges even though the document width matched the viewport. On `/feed/home` at 320 pixels, focusing the Search tab left it entirely offscreen; focusing Galleries shifted the surrounding layout instead of scrolling the strip itself. Also check the editor, profile, and admin strips: they clipped tabs at one or both widths.
- On `/feed/home` at 320 pixels, the shared sort row put most of Refresh and part of Top outside the viewport. Both controls fit at 390 pixels. Keep all sort actions visible without relying on browser focus scrolling.
- The signed-in navbar and Post editor text area and action buttons stayed within the measured horizontal bounds at both widths. These checks do not establish touch behavior, real-device support, or a supported minimum width.

## Relevant Files
- app/app.vue
- app/pages/feed.vue
- app/components/lists/Feed.vue
- app/pages/editor/
- app/pages/profile/
- app/pages/admin/settings.vue
- app/components/navigation/PagedTabstrip.client.vue
- app/plugins/directives.ts
- app/components/
- app/assets/scss/
- tests/utils/browser-fixtures.ts
- tests/parallel/

## Progress Log
- 2026-11-27: Checked Search, Home, the Post editor, Preferences, Admin Settings, and Moderator Topics on signed-in production `v2026.6.6` at 390 and 320 CSS pixels. Recorded clipped tabs and sort controls. Restored the desktop viewport; no physical phone was used.
- 2026-11-19: Ticket created.
