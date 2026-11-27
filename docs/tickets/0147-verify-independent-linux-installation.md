# Ticket 0147: Verify Independent Linux Installation

## Status
- State: Planned
- Priority: Medium
- Next: Recruit an operator who did not write the guide to install the published Linux x64 package on a clean supported host.

## Goal
Verify that an operator can install ClassicForum using only the published instructions, without a source checkout or help from the guide's author.

## Requirements
- [ ] An operator who did not write the guide completes a clean installation using only the published Quickstart and the supported Linux x64 release assets.
- [ ] The operator verifies the archive checksum and confirms both the app and database report ready at the intended version.
- [ ] The record includes the exact release, host and runtime profile, elapsed time, and any blockers or assistance. Compare elapsed time with the roadmap's 30-minute target without treating it as a pass criterion.
- [ ] If the operator needs undocumented steps or help, update the instructions and obtain a clean, unassisted recheck.

## Tasks
- [ ] Select an independent operator, a clean supported Linux x64 host, and a published release to install.
- [ ] Have the operator follow Quickstart without coaching and record steps, elapsed time, checksum validation, and readiness.
- [ ] Correct any documentation gaps, obtain an unassisted recheck if needed, and record the result.

## Notes
- Split from Ticket 0118. The production owner's successful `2026.6.6` install and upgrade are useful deployment evidence, but do not satisfy independent installation.
- Use an isolated host rather than the production deployment. Upgrade and recovery acceptance remain in Ticket 0118.

## Relevant Files
- docs/Quickstart.md
- docs/Hosting.md
- docs/Support.md
- docs/Roadmap.md
- scripts/installer.sh

## Progress Log
- 2026-11-27: Ticket created.
