# Ticket 0127: Publish A Verifiable Pilot Release

## Status
- State: In Progress
- Priority: High
- Next: Complete the release notes, verify a fresh download of the published archive, and record production data validation.

## Goal
Publish a verified Linux x64 package so it can be downloaded and applied to the existing production deployment. Keep the release process small and repeatable; do not expand to unverified platforms.

## Requirements
- [ ] The chosen version, source commit/tag, changelog, published release notes, and packaged runtime version agree.
- [x] The public release provides an archive for each explicitly supported OS/architecture and SHA-256 checksums with verification instructions.
- [x] Each advertised archive is built for its target platform, contains its production dependencies and environment example, and excludes live configuration, credentials, databases, and user media.
- [ ] A fresh download from the public release is checksum-verified and matched to the validated candidate; archive installation requires no source checkout or contributor dependency installation.
- [ ] Apply the verified package to the production deployment after a fresh backup and explicit approval; verify the running version, readiness, and persisted data.
- [ ] Release notes identify pilot/stable status, supported environments, installation/upgrade links, known limitations, and the applicable support policy.
- [ ] Exact validation evidence is linked, and unavailable or unverified platforms/features are not advertised as supported.
- [x] The publication and withdrawal/correction procedure is documented without retagging an already published version to different source or silently replacing its artifacts.

## Tasks
- [x] Review the existing staging script and versioning process and choose the smallest supported pilot configuration.
- [x] Write the release checklist, including source/version checks, safe archive contents, checksum generation, and validation evidence.
- [x] Stage the native candidate and complete the prerequisite checks before publishing its tag, notes, and assets.
- [x] Configure CI to publish the version-matched `CHANGELOG.md` section as release notes with the archive and checksum.
- [ ] Independently download and verify the published archive and record its digest and source identity.
- [x] Deploy the approved `2026.6.3` build to production; verify the reported running version and app/database readiness.
- [ ] Verify the installed archive's checksum and provenance, and compare persisted data with its pre-deployment state.
- [x] Document how operators learn about a withdrawn or corrected pilot release.

## Notes
- Completed [0032](completed/0032-release-versioning-changelog.md) intentionally deferred tagging and the fuller release checklist. Local archive staging is not public publication.
- Earlier staged 2026.6.3 candidate evidence is recorded in [0118](0118-close-public-release-validation-gaps.md). Its Linux x64 archive was built from commit `dd9a38914bd803fd83dc2ac9220ea019d51ea77a` (SHA-256 `aecf492a8aca9a551e45e964780faf3dc9f66765af9f33a1ab7648dcedafd44f`) and passed isolated WSL service, reverse-proxy, backup-first upgrade, and recovery rehearsals. The published release is a different archive at commit `20c02b9b5b83645ed7165838ca29dd6e3272b77c`; independent-operator acceptance, live SMTP/onboarding, and diagnosis of the historical 31/32 test summary remain open. Do not advertise unverified workflows as validated.
- The WSL rehearsals used isolated data and the earlier candidate archive. Production Developer Info now reports `2026.6.3` at the published tag and commit, with app and database ready. The remote database backup was skipped at the user's direction. The installed archive's provenance and a pre/post persisted-data comparison have not been independently recorded here.
- An initial check on 2026-11-18 found no GitHub release or `v2026.6.3` tag; CI published the release later that day.
- [0129](0129-complete-public-adoption-entrypoints.md) connects operators to the resulting download. [0130](0130-verify-smtp-and-first-upload-onboarding.md) must verify email-dependent workflows before they are promoted to pilots; it can test an unpublished candidate.
- Demo reliability, hosting measurements, and support guidance are separate under [0128](0128-verify-demo-navigation-and-hydration.md), [0131](0131-document-pilot-hosting-requirements-and-limits.md), and [0132](0132-publish-operator-support-guidance-and-bug-intake.md).
- GitHub published `v2026.6.3` with a Linux x64 archive and SHA-256 asset. The release page currently contains only a generated changelog link; add the approved pilot status, supported environment, install/upgrade links, limitations, and support policy before treating the release-note requirement as complete. A fresh archive download and independent production acceptance remain open.
- Follow the [release skill](../../.github/skills/release/SKILL.md) and [Contributing](../Contributing.md). Publication is complete; release-note completeness, fresh-download verification, and independent production acceptance remain open.

## Relevant Files
- scripts/stage-release.mjs
- scripts/extract-release-notes.mjs
- .github/workflows/ci.yml
- [release skill](../../.github/skills/release/SKILL.md)
- scripts/installer.sh
- package.json
- CHANGELOG.md
- docs/Contributing.md
- docs/Quickstart.md
- SECURITY.md

## Progress Log
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
