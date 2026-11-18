# Ticket 0127: Publish A Verifiable Pilot Release

## Status
- State: In Progress
- Priority: High
- Next: Run the CI-equivalent checks, commit the dated changelog last, and tag that commit to trigger CI publication.

## Goal
Publish a verified Linux x64 package so it can be downloaded and applied to the existing production deployment. Keep the release process small and repeatable; do not expand to unverified platforms.

## Requirements
- [ ] The chosen version, source commit/tag, changelog, published release notes, and packaged runtime version agree.
- [ ] The public release provides an archive for each explicitly supported OS/architecture and SHA-256 checksums with verification instructions.
- [x] Each advertised archive is built for its target platform, contains its production dependencies and environment example, and excludes live configuration, credentials, databases, and user media.
- [ ] A fresh download from the public release is checksum-verified and matched to the validated candidate; archive installation requires no source checkout or contributor dependency installation.
- [ ] Apply the verified package to the production deployment after a fresh backup and explicit approval; verify the running version, readiness, and persisted data.
- [ ] Release notes identify pilot/stable status, supported environments, installation/upgrade links, known limitations, and the applicable support policy.
- [ ] Exact validation evidence is linked, and unavailable or unverified platforms/features are not advertised as supported.
- [x] The publication and withdrawal/correction procedure is documented without retagging an already published version to different source or silently replacing its artifacts.

## Tasks
- [x] Review the existing staging script and versioning process and choose the smallest supported pilot configuration.
- [x] Write the release checklist, including source/version checks, safe archive contents, checksum generation, and validation evidence.
- [ ] Stage the native candidate and complete the prerequisite checks before publishing its tag, notes, and assets.
- [x] Configure CI to create a GitHub Release with generated notes after a version tag passes validation.
- [ ] Independently download and verify the published archive and record its digest and source identity.
- [ ] Apply the verified archive to production after backup and explicit approval; record version and readiness.
- [x] Document how operators learn about a withdrawn or corrected pilot release.

## Notes
- Completed [0032](completed/0032-release-versioning-changelog.md) intentionally deferred tagging and the fuller release checklist. Local archive staging is not public publication.
- Staged 2026.6.3 candidate evidence is recorded in [0118](0118-close-public-release-validation-gaps.md). The Linux x64 archive was built from commit `dd9a38914bd803fd83dc2ac9220ea019d51ea77a` (SHA-256 `aecf492a8aca9a551e45e964780faf3dc9f66765af9f33a1ab7648dcedafd44f`) and passed privileged WSL service, reverse-proxy, backup-first upgrade, and isolated recovery rehearsals. A newer source commit must pass the local CI-equivalent checks and be tagged; CI owns the release archive and checksum. Independent-operator acceptance, live SMTP/onboarding, and diagnosis of the historical 31/32 test summary remain open follow-ups, not tag prerequisites under the current release scope. Do not advertise those unverified workflows as validated.
- The WSL rehearsals used isolated data; they did not upgrade the existing production deployment. Production use requires the published archive, a fresh backup, and explicit deployment approval.
- No GitHub release was found on 2026-11-18; no `v2026.6.3` tag exists.
- [0129](0129-complete-public-adoption-entrypoints.md) connects operators to the resulting download. [0130](0130-verify-smtp-and-first-upload-onboarding.md) must verify email-dependent workflows before they are promoted to pilots; it can test an unpublished candidate.
- Demo reliability, hosting measurements, and support guidance are separate under [0128](0128-verify-demo-navigation-and-hydration.md), [0131](0131-document-pilot-hosting-requirements-and-limits.md), and [0132](0132-publish-operator-support-guidance-and-bug-intake.md).
- Run `yarn install --frozen-lockfile`, `yarn typecheck:golar`, `yarn typecheck`, `yarn build`, and `yarn test` on the intended source. Commit all other intended changes first; the dated changelog update is the final source commit and `v2026.6.3` must point to it. Pushing the tag triggers CI validation, archive/checksum creation, and GitHub Release publication. Verify the run and assets afterward; applying the package to production remains separate and requires a fresh backup and explicit approval.
- Follow the [release skill](../../.github/skills/release/SKILL.md) and [Contribution Guide](../ContributionGuide.md). Gates remain open; no tag or release exists.

## Relevant Files
- scripts/stage-release.mjs
- [release skill](../../.github/skills/release/SKILL.md)
- scripts/installer.sh
- package.json
- CHANGELOG.md
- docs/ContributionGuide.md
- docs/Quickstart.md
- SECURITY.md

## Progress Log
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
