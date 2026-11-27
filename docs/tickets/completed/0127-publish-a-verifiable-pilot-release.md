# Ticket 0127: Publish A Verifiable Pilot Release

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Publish a verified Linux x64 package so it can be downloaded and applied to the existing production deployment. Keep the release process small and repeatable; do not expand to unverified platforms.

## Requirements
- [x] The chosen version, source commit/tag, changelog, published release notes, and packaged runtime version agree.
- [x] The public release provides an archive for each explicitly supported OS/architecture and SHA-256 checksums with verification instructions.
- [x] Each advertised archive is built for its target platform, contains its production dependencies and environment example, and excludes live configuration, credentials, databases, and user media.
- [x] The installer downloads and SHA-256 verifies the published package from the validated release without requiring a source checkout or contributor dependency installation.
- [x] Record the owner's successful production upgrade and independently confirm the running version, build identity, and app/database readiness.
- [x] The successful Release workflow publishes the unique dated `CHANGELOG.md` section matching the tag as the GitHub release notes.
- [x] The full CI suite passed on the exact tagged commit, and the result is linked.
- [x] The published release offers Linux x64 only and describes shipped changes without advertising unfinished workflows as supported.
- [x] The publication and withdrawal/correction procedure is documented without retagging an already published version to different source or silently replacing its artifacts.

## Tasks
- [x] Review the existing staging script and versioning process and choose the smallest supported pilot configuration.
- [x] Write the release checklist, including source/version checks, safe archive contents, checksum generation, and validation evidence.
- [x] Stage the native candidate and complete the prerequisite checks before publishing its tag, notes, and assets.
- [x] Configure CI to publish the version-matched `CHANGELOG.md` section as release notes with the archive and checksum.
- [x] Match the current tag to the successful Pipeline and Release runs, published notes, Linux x64 archive, and checksum sidecar.
- [x] Record the owner's report of a successful documented install and upgrade and the resulting production version.
- [x] Match the production build's displayed commit to the release and record the current readiness result.
- [x] Record the installer checksum result, published digest, and deployed build identity.
- [x] Deploy the approved `2026.6.3` build to production; verify the reported running version and app/database readiness.
- [x] Record the limits of the production upgrade evidence and move remote backup and restore verification to Ticket 0148.
- [x] Document how operators learn about a withdrawn or corrected pilot release.

## Notes
- Completed Ticket 0032 intentionally deferred tagging and the fuller release checklist. Local archive staging is not public publication.
- Earlier staged 2026.6.3 candidate evidence is recorded in Ticket 0118. Its Linux x64 archive was built from commit `dd9a38914bd803fd83dc2ac9220ea019d51ea77a` (SHA-256 `aecf492a8aca9a551e45e964780faf3dc9f66765af9f33a1ab7648dcedafd44f`) and passed isolated WSL service, reverse-proxy, backup-first upgrade, and recovery rehearsals. The published `v2026.6.3` archive was built from a different commit, `20c02b9b5b83645ed7165838ca29dd6e3272b77c`. The historical 31/32 result remains undiagnosed and is not a release blocker.
- The WSL rehearsals used isolated data and the earlier candidate archive. During the historical `2026.6.3` deployment, Developer Info matched the published tag and commit, and the app and database reported ready. The remote database backup was skipped for that deployment.
- An initial check on 2026-11-18 found no GitHub release or `v2026.6.3` tag; CI published the release later that day.
- Ticket 0129 connects operators to the resulting download. Ticket 0130 must verify email-dependent workflows before they are promoted to pilots; it can test an unpublished candidate.
- Demo reliability, hosting measurements, and support guidance are separate under Tickets 0128, 0131, and 0132.
- The owner accepted the successful installer SHA-256 check from the remote SurrealDB production upgrade as the archive verification. No independent re-download is required. Developer Info and `/api/health` separately confirm the deployed version, displayed commit, and readiness; they do not prove which individual records survived the upgrade.
- The owner did not create an installer backup. It covers embedded RocksDB only, and the upgrade command does not create backups. No separate pre-upgrade remote database backup or record-level before/after comparison was documented for `2026.6.6`. Ticket 0148 tracks remote backup and restore validation separately. This does not change the requirement for a fresh backup and explicit approval before future production upgrades.
- Ticket 0147 tracks independent installation using the published instructions; it was not required for pilot release closure.
- The `v2026.6.6` tag, `package.json`, dated changelog entry, published release notes, versioned migration, and observed production runtime agree on the version. CI owns release-note publication; no separate addendum or manual edit is required. Installation and upgrade guidance belongs in Quickstart; hosting limits and pilot support policy remain with Tickets 0131 and 0132.
- Follow the release skill and Contribution Guide. Keep the Roadmap's release summary aligned with verified source and deployment evidence, without assuming the two are identical.

## Relevant Files
- scripts/stage-release.mjs
- scripts/extract-release-notes.mjs
- .github/workflows/pipeline.yml
- .github/workflows/release.yml
- .github/skills/release/SKILL.md
- scripts/installer.sh
- package.json
- CHANGELOG.md
- docs/Contributing.md
- docs/Hosting.md
- docs/Roadmap.md
- docs/Quickstart.md
- docs/Backups.md
- docs/Support.md
- SECURITY.md

## Progress Log
- 2026-11-27: Completed pilot release validation. The owner moved remote backup and restore testing to Ticket 0148. The `2026.6.6` production upgrade and readiness are recorded without claiming a verified pre-upgrade backup or record-level comparison.
- 2026-11-27: Accepted the installer checksum check for `v2026.6.6`; the matching deployed build identity and published digest were already recorded. The archive and release coverage gates are complete. Production backup and before/after data evidence remain open.
- 2026-11-27: The owner confirmed the established CI-driven notes convention. The published `v2026.6.6` notes already match the tagged changelog, so the release-notes requirement is complete and the unpublished manual addendum was removed.
- 2026-11-27: Read-only production inspection: Developer Info reported Production mode, version `2026.6.6`, ref `v2026.6.6`, and commit prefix `7061d1a01479`, which matches the published release's CI commit. `/api/health` reported `app: ready`, `database: ready`, `version: 2026.6.6`, and no failure reason. The owner confirmed the installer checksum passed. No independent hash, backup verification, or before-and-after data comparison was performed.
- 2026-11-27: Drafted the pilot release note addendum from the published release and deployment evidence. It is not approved or published; the tag and release assets are unchanged.
- 2026-11-27: The production owner reported following the documented setup, successfully upgrading through the installer with a remote database, and seeing the site running `2026.6.6` with data migrated successfully. No installer backup was created. Exact deployment commit, backup evidence, individual persisted-data checks, and independent archive verification remain unrecorded.
- 2026-11-27: The [Pipeline job](https://github.com/tcm151/dox/actions/runs/45745675350/job/139661000452) passed the full `yarn test` suite (264/264), and the [Release run](https://github.com/tcm151/dox/actions/runs/45746154535) passed for the same commit, `7061d1a01479987fc70649c09216749a7f992a46`. The [public `v2026.6.6` release](https://github.com/tcm151/dox/releases/tag/v2026.6.6) contains the Linux x64 archive and checksum sidecar; the sidecar lists `b1207076cf206ef4a667a7c897f1b2cee97e763cd3d55bfe45ff1124f98acf86`, matching GitHub's archive digest. The archive itself was not downloaded and hashed, and the production deployment was not checked or changed during that review.
- 2026-11-27: Reviewed tagged source `v2026.6.6` (`7061d1a0`) against the release checklist. Exact-commit CI, public assets, a fresh checksum verification, and the current production version and data were not verified in this review.
- 2026-11-18: Confirmed the published `2026.6.3` build is installed at `forum.tcmdev.ca`; Developer Info matches the published tag/commit and health reports app/database ready. The remote database backup was skipped at the user's direction; archive provenance and persisted-data comparison remain open.
- 2026-11-18: CI now publishes the unique dated `CHANGELOG.md` section matching the tag version and fails on missing or duplicate sections. The already-published `v2026.6.3` release was not changed.
- 2026-11-18: Verified the public `v2026.6.3` tag, Linux x64 archive, checksum asset, and matching production version/commit. Added checksum verification to Quickstart; release notes, fresh-download verification, and independent production acceptance remain open.
- 2026-11-18: Final Windows validation passed: frozen install, Golar and Nuxt typechecks, production build, and full suite (251/251). The build emitted the existing Rollup comment-position warning. Moved the global cross-type search pagination case to the sequential search suite after intermittent omissions in parallel runs; loosened the freshness test's final request count to allow redundant requests while still requiring recovery. No tag created.
- 2026-11-18: Aligned release preparation with the user's CI-driven workflow: local checks and a clean source tree precede a final dated changelog commit, and the version tag points to that commit. CI owns archive/checksum creation and GitHub Release publication; independent installation, live SMTP/onboarding, and production deployment remain separately tracked. No tag created.
- 2026-11-18: Clarified that the 2026.6.3 package is needed for the existing production deployment; added post-publication backup, approval, and verification checks. WSL rehearsals remain isolated.
- 2026-11-18: Added the release procedure to the skill and Contribution Guide, updated CI guidance, and drafted the 2026.6.3 changelog. Gates remain open; no tag or release was created.
- 2026-11-18: Audited the Linux x64 archive contents and checksum. Live config/data are absent; public download verification remains open.
- 2026-11-18: Selected Linux x64. CI now checks tag/version, builds the archive, generates a SHA-256 file, and uploads both assets after validation. Local checks passed; no tag was pushed.
- 2026-11-18: Initial candidate record: no Windows archive or tag existed; platform scope and asset upload were pending.
- 2026-11-18: Linked WSL upgrade and recovery evidence from [0118](0118-close-public-release-validation-gaps.md). Candidate gates remain open.
- 2026-11-18: Updated CI to Node.js 24 and GitHub Release creation. No tag was pushed or release published.
- 2026-11-17: Routed security/behavior prerequisites through final candidate acceptance in 0118 and added the staged SMTP/onboarding gate. Publication preparation may proceed; no release was published.
- 2026-11-17: Ticket created. Publication, downloads, installation, and runtime validation have not been performed.
