# Ticket 0127: Publish A Verifiable Pilot Release

## Status
- State: Planned
- Priority: High
- Next: Select the pilot release candidate and its supported OS/architecture.

## Dependencies
- [0118](0118-close-public-release-validation-gaps.md): Complete candidate checks and packaged installation/recovery validation before publication.
- [0130](0130-verify-smtp-and-first-upload-onboarding.md): Verify the pilot's transactional mail and confirmed-account image journey against the candidate before advertising those workflows.

## Goal
Give operators a tested release they can download and verify without using the contributor build workflow. Establish a small repeatable publication checklist rather than a new multi-platform release framework.

## Requirements
- [ ] The chosen version, source commit/tag, changelog, published release notes, and packaged runtime version agree.
- [ ] The public release provides an archive for each explicitly supported OS/architecture and SHA-256 checksums with verification instructions.
- [ ] Each advertised archive is built for its target platform, contains its production dependencies and environment example, and excludes live configuration, credentials, databases, and user media.
- [ ] A fresh download from the public release is checksum-verified and matched to the validated candidate; archive installation requires no source checkout or contributor dependency installation.
- [ ] Release notes identify pilot/stable status, supported environments, installation/upgrade links, known limitations, and the applicable support policy.
- [ ] Exact validation evidence is linked, and unavailable or unverified platforms/features are not advertised as supported.
- [ ] The publication and withdrawal/correction procedure is documented without retagging an already published version to different source or silently replacing its artifacts.

## Tasks
- [ ] Review the existing staging script and versioning process and choose the smallest supported pilot configuration.
- [ ] Write the release checklist, including source/version checks, safe archive contents, checksum generation, and validation evidence.
- [ ] Stage the native candidate and complete the prerequisite checks before publishing its tag, notes, and assets.
- [x] Configure CI to create a GitHub Release with generated notes after a version tag passes validation.
- [ ] Independently download and verify the published archive and record its digest and source identity.
- [ ] Document how operators learn about a withdrawn or corrected pilot release.

## Notes
- Completed [0032](completed/0032-release-versioning-changelog.md) intentionally deferred tagging and the fuller release checklist. Local archive staging is not public publication.
- No published GitHub releases were found during the 2026-11-17 review; recheck the actual release destination when implementing rather than assuming that observation remains current.
- [0129](0129-complete-public-adoption-entrypoints.md) connects operators to the resulting download. [0130](0130-verify-smtp-and-first-upload-onboarding.md) must verify email-dependent workflows before they are promoted to pilots; it can test an unpublished candidate.
- Demo reliability, hosting measurements, and support guidance are separate under [0128](0128-verify-demo-navigation-and-hydration.md), [0131](0131-document-pilot-hosting-requirements-and-limits.md), and [0132](0132-publish-operator-support-guidance-and-bug-intake.md).
- Publication is a future authorized release operation, not permission to tag, upload, or deploy during ticket preparation.
- CI creates a GitHub Release from a `v*` tag only after validation succeeds. It does not publish release archives or checksums, and configuring the workflow does not mean a pilot release has been published.

## Relevant Files
- scripts/stage-release.mjs
- scripts/installer.sh
- package.json
- CHANGELOG.md
- docs/ContributionGuide.md
- docs/Quickstart.md
- SECURITY.md

## Progress Log
- 2026-11-18: Updated CI to use Node.js 24 and create a GitHub Release with generated notes after successful validation of a `v*` tag. No tag was pushed and no release was published.
- 2026-11-17: Routed security/behavior prerequisites through final candidate acceptance in 0118 and added the staged SMTP/onboarding gate. Publication preparation may proceed; no release was published.
- 2026-11-17: Ticket created. Publication, downloads, installation, and runtime validation have not been performed.
