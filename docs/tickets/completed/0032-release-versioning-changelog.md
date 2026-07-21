# Ticket 0032: Release Versioning And Changelog Process

## Status
- State: Done
- Priority: Medium
- Next action: None

## Goal
Establish a lightweight release process with clear versioning and a maintained changelog.

## Done Looks Like
- [x] Versioning approach is documented.
- [x] Changelog format and update process are defined.
- [x] Current package release includes a changelog entry.

## Tasks
- [x] Add release/versioning section to docs.
- [x] Create changelog file and starter structure.
- [x] Defer release checklist and tagging details until the process is clearer.

## Notes
- Keep process sustainable for solo maintenance.
- Use `year.major.patch` versions for a continuous release/deployment strategy. The current version is `2026.5.0` after retroactively grouping the 2026 work into release blocks.
- `package.json` owns the application version; Nuxt public runtime config should read from it.
- Hold off on tagging automation and the fuller release checklist until the process is clearer.

## Relevant Files
- README.md
- CHANGELOG.md
- docs/Roadmap.md
- docs/ContributionGuide.md
- package.json
- nuxt.config.ts

## Progress Log
- 2026-07-21: Completed ticket; release checklist/tagging work remains intentionally deferred for a future ticket.
- 2026-07-21: Expanded changelog into retroactive release blocks grouped by significant time periods from commit history; updated package version to `2026.5.0` to match the latest release block.
- 2026-07-21: Marked in progress; documented `year.major.patch` versioning; added package-owned version source; created starter changelog.
- 2026-04-13: Ticket created.