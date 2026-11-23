# Ticket 0138: Accessibility Baseline for Core Workflows

## Status
- State: `Planned`
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

## Relevant Files
- app/components/system/Login.client.vue
- app/pages/feed.vue
- app/pages/feed/home.vue
- app/pages/editor/
- app/pages/settings/
- tests/utils/browser-fixtures.ts
- tests/parallel/
- playwright.config.ts
- docs/Contributing.md

## Progress Log
- 2026-11-19: Ticket created.
