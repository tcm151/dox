# Ticket 0138: Accessibility Baseline for Core Workflows

## Status
- State: `In Progress`
- Priority: `Medium`
- Next: Define the conformance target and representative assistive-technology test matrix.

## Goal
Establish and improve accessibility across sign-in, feed browsing, publishing, and settings. Use focused manual reviews and browser regressions to make core workflows usable with keyboard and screen-reader navigation.

## Requirements
- [ ] A documented accessibility target and representative browser and assistive-technology test matrix cover the scoped workflows.
- [ ] Keyboard-only review verifies logical navigation, visible focus, usable controls, and no keyboard traps in each scoped workflow.
- [ ] Screen-reader review verifies meaningful names, roles, state, and announcements for navigation, form validation, and important interaction results.
- [ ] High-impact barriers found in scope are fixed or transferred to linked follow-up tickets with clear acceptance criteria.
- [ ] Focused accessibility regression checks run in the existing browser test suite, and remaining known limitations are documented.

## Tasks
- [ ] Select the conformance target, assistive technologies, browsers, and representative sign-in, feed, publishing, and settings journeys.
- [ ] Audit the scoped journeys with keyboard-only and screen-reader navigation, recording reproducible findings.
- [ ] Fix high-impact issues in the owning components and create linked follow-up tickets for intentionally deferred work.
- [ ] Add focused browser regressions for corrected accessibility barriers and document the review results.

## Notes
- Reuse the existing isolated browser validation infrastructure from completed Ticket 0062; keep automated checks focused on actionable regressions rather than treating an automated scan as proof of full conformance.
- Assumption to confirm during scope definition: use WCAG 2.2 AA as the review target.
- The current release adds HTML `name` attributes to some settings controls. These are not accessible names by themselves; include the moved `/profile/*` forms and admin settings in the label, keyboard, and screen-reader review.
- On `/feed/search`, Tab reached the advanced filters button, Space opened it, and the next Tab reached Type. The button exposes its expanded state but has no accessible name. Fixed: the button now has an accessible "Search filters" name with unchanged keyboard behavior.
- On `/editor/post`, Title and Content have visible labels but appear as unnamed textboxes. The Link and Title inputs on `/editor/link` also have no associated labels. Fixed: labels are associated through `for`/`id`, the shared Markdown editor associates its label with the textarea via `useId`, and its icon-only toolbar buttons expose their tool names as accessible labels.
- On `/profile/preferences`, the animation and notification checkboxes use `display: none` in the shared Toggle, so they cannot receive keyboard focus or appear in the accessibility tree. Fixed: the Toggle checkbox is now visually hidden but focusable with a focus-visible ring on the switch, and it takes an accessible name from a new `ariaLabel` prop (falling back to the visible `label` prop). The preferences toggles and Hint duration field now carry accessible names.
- Admin settings toggles still pass only `name` (an HTML form name, not an accessible name); include them when reworking the `/admin/settings` section navigation.
- On `/admin/settings`, section choices are clickable headings. On `/moderator/topics`, the topic tools and reports actions are clickable `div` elements. The rendered controls have no interactive role and are not in the tab order. Use buttons for changing settings sections and named links for opening topic tools or reports.
- At 320 CSS pixels on `/feed/home`, the Search tab remained fully offscreen when focused. Ticket 0139 tracks the shared layout; include focus visibility in its regression check.

## Relevant Files
- app/components/system/Login.client.vue
- app/pages/feed.vue
- app/pages/feed/home.vue
- app/pages/feed/search.vue
- app/pages/editor/
- app/pages/profile/
- app/pages/admin/settings.vue
- app/pages/moderator/topics.vue
- app/components/form/MarkdownEditor.vue
- app/components/form/Toggle.vue
- tests/utils/browser-fixtures.ts
- tests/parallel/
- playwright.config.ts
- docs/Contributing.md

## Progress Log
- 2026-11-27: Fixed the recorded naming and focus barriers in source: named the advanced search filters toggle, associated the post/link editor labels and the shared Markdown textarea with their inputs, gave Markdown toolbar buttons accessible labels, made the shared Toggle checkbox focusable with a visible focus ring and accessible name, and named the preferences toggles and Hint duration field. Added focused browser regressions in the search, settings, and editor parallel suites. Source-verified only; no test run, screen reader, or rendered check was possible in this workspace. The `/admin/settings` and `/moderator/topics` mouse-only controls remain open.
- 2026-11-27: Reviewed editor, preferences, admin settings, and moderator topic controls on signed-in production `v2026.6.6`. Confirmed missing labels, hidden checkboxes, and mouse-only controls in the rendered page or accessibility snapshot. This was not a screen-reader review.
- 2026-11-27: Checked keyboard navigation into the advanced search filters and confirmed the unnamed toggle in the accessibility snapshot. Did not run a screen reader or complete the keyboard review.
- 2026-11-19: Ticket created.
