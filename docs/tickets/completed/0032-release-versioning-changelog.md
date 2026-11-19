# Ticket 0032: Release Versioning And Changelog Process

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Establish a lightweight release process with clear versioning and a maintained changelog.

## Requirements
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
- The original scope deferred tagging and the fuller release checklist. Public pilot archives, tags, checksums, and publication evidence are now tracked in [0127](../0127-publish-a-verifiable-pilot-release.md); this completed ticket does not establish that a release was published.

## Relevant Files
- README.md
- CHANGELOG.md
- docs/Roadmap.md
- docs/Contributing.md
- package.json
- nuxt.config.ts

## Progress Log
- 2026-11-17: Linked the deferred publication/checklist work to Ticket 0127. Preserved completed scope and historical results; no release was tagged or published.
- 2026-07-21: Completed ticket; release checklist/tagging work remains intentionally deferred for a future ticket.
- 2026-07-21: Expanded changelog into retroactive release blocks grouped by significant time periods from commit history; updated package version to `2026.5.0` to match the latest release block.
- 2026-07-21: Marked in progress; documented `year.major.patch` versioning; added package-owned version source; created starter changelog.
- 2026-04-13: Ticket created.