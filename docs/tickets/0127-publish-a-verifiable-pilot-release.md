# Ticket 0127: Publish A Verifiable Pilot Release

## Status
- State: In Progress
- Priority: High
- Next: Complete the independent-operator and live SMTP gates before tagging the Linux x64 candidate.

## Dependencies
- [0118](0118-close-public-release-validation-gaps.md): Complete candidate checks and packaged installation/recovery validation before publication.
- [0130](0130-verify-smtp-and-first-upload-onboarding.md): Verify the pilot's transactional mail and confirmed-account image journey against the candidate before advertising those workflows.

## Goal
Give operators a tested release they can download and verify without using the contributor build workflow. Establish a small repeatable publication checklist rather than a new multi-platform release framework.

## Requirements
- [ ] The chosen version, source commit/tag, changelog, published release notes, and packaged runtime version agree.
- [ ] The public release provides an archive for each explicitly supported OS/architecture and SHA-256 checksums with verification instructions.
- [x] Each advertised archive is built for its target platform, contains its production dependencies and environment example, and excludes live configuration, credentials, databases, and user media.
- [ ] A fresh download from the public release is checksum-verified and matched to the validated candidate; archive installation requires no source checkout or contributor dependency installation.
- [ ] Release notes identify pilot/stable status, supported environments, installation/upgrade links, known limitations, and the applicable support policy.
- [ ] Exact validation evidence is linked, and unavailable or unverified platforms/features are not advertised as supported.
- [x] The publication and withdrawal/correction procedure is documented without retagging an already published version to different source or silently replacing its artifacts.

## Tasks
- [x] Review the existing staging script and versioning process and choose the smallest supported pilot configuration.
- [x] Write the release checklist, including source/version checks, safe archive contents, checksum generation, and validation evidence.
- [ ] Stage the native candidate and complete the prerequisite checks before publishing its tag, notes, and assets.
- [x] Configure CI to create a GitHub Release with generated notes after a version tag passes validation.
- [ ] Independently download and verify the published archive and record its digest and source identity.
- [x] Document how operators learn about a withdrawn or corrected pilot release.

## Notes
- Completed [0032](completed/0032-release-versioning-changelog.md) intentionally deferred tagging and the fuller release checklist. Local archive staging is not public publication.
- Staged 2026.6.3 candidate evidence is recorded in [0118](0118-close-public-release-validation-gaps.md). The Linux x64 archive was built from commit `dd9a38914bd803fd83dc2ac9220ea019d51ea77a` (SHA-256 `aecf492a8aca9a551e45e964780faf3dc9f66765af9f33a1ab7648dcedafd44f`) and passed privileged WSL service, reverse-proxy, backup-first upgrade, and isolated recovery rehearsals. It is not published; independent-operator acceptance, live SMTP/onboarding, and the unidentified 31/32 test failure remain open, so candidate acceptance is incomplete.
- No GitHub release was found on 2026-11-17; check the current release destination before tagging.
- [0129](0129-complete-public-adoption-entrypoints.md) connects operators to the resulting download. [0130](0130-verify-smtp-and-first-upload-onboarding.md) must verify email-dependent workflows before they are promoted to pilots; it can test an unpublished candidate.
- Demo reliability, hosting measurements, and support guidance are separate under [0128](0128-verify-demo-navigation-and-hydration.md), [0131](0131-document-pilot-hosting-requirements-and-limits.md), and [0132](0132-publish-operator-support-guidance-and-bug-intake.md).
- Tag and publish only after gates pass and the user authorizes it. CI attaches the Linux x64 archive and checksum after validation.
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
- 2026-11-18: Added the release procedure to the skill and Contribution Guide, updated CI guidance, and drafted the 2026.6.3 changelog. Gates remain open; no tag or release was created.
- 2026-11-18: Audited the Linux x64 archive contents and checksum. Live config/data are absent; public download verification remains open.
- 2026-11-18: Selected Linux x64. CI now checks tag/version, builds the archive, generates a SHA-256 file, and uploads both assets after validation. Local checks passed; no tag was pushed.
- 2026-11-18: Initial candidate record: no Windows archive or tag existed; platform scope and asset upload were pending.
- 2026-11-18: Linked WSL upgrade and recovery evidence from [0118](0118-close-public-release-validation-gaps.md). Candidate gates remain open.
- 2026-11-18: Updated CI to Node.js 24 and GitHub Release creation. No tag was pushed or release published.
- 2026-11-17: Routed security/behavior prerequisites through final candidate acceptance in 0118 and added the staged SMTP/onboarding gate. Publication preparation may proceed; no release was published.
- 2026-11-17: Ticket created. Publication, downloads, installation, and runtime validation have not been performed.
