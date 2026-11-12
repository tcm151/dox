# Ticket 0021: API Contract Inventory

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Create a practical API inventory documenting route access and important contracts for safer iteration.

## Requirements
- [x] Every feature route under `server/api/` is cataloged with method, path, access, and purpose; the catch-all is documented separately.
- [x] Important workflows have focused request, response, validation, side-effect, source, and test details verified against handlers and tests.
- [x] Route tables link only to detailed contracts; direct source and test links appear in the detail sections.
- [x] The programming and testing skills explain how to maintain the index as routes evolve.

## Tasks
- [x] Enumerate routes under `server/api/` and group them by feature area.
- [x] Document method, access requirements, and purpose for each route.
- [x] Add focused contracts for important workflows and link their sources and tests.
- [x] Verify route coverage and internal links against the source tree.
- [x] Update the programming and testing skills to reference the API index.

## Notes
- The catch-all handler is documented separately and excluded from feature-route coverage.
- The inventory describes intended client methods; verify behavior against route handlers and tests when it changes.

## Relevant Files
- docs/API.md
- docs/Roadmap.md
- server/api/
- server/utils/
- tests/parallel/
- .github/skills/find-replace/SKILL.md
- .github/skills/programming/SKILL.md
- .github/skills/testing/SKILL.md

## Progress Log
- 2026-11-12: Completed the API inventory with full feature-route coverage, focused workflow contracts, skill references, and a source-to-index audit.
- 2026-04-13: Ticket created.