---
name: release
description: "Use for ClassicForum release preparation or publication: versioning, changelogs, acceptance gates, artifacts, commits, tags, GitHub Releases, and corrections."
argument-hint: "Optional target version or release ticket"
---

# Staged Release Procedure

Follow this workflow from candidate selection through post-release verification. Staging is not publication.

## 1. Establish Scope And Authority

- Read the project guide, roadmap, release ticket and dependencies, plus relevant install, support, and demo docs. Check the staging script, CI workflow, package version, and changelog.
- Check the latest tag, GitHub release state, and dirty/untracked files. Preserve unrelated work and stage only release files.
- Confirm the version, platform scope, release claims, and authorized actions. Do not tag, push, publish, deploy, or announce until acceptance gates pass and the user authorizes it.

## 2. Freeze The Candidate And Resolve Gates

- Pin one source commit. Reconcile all release-blocking ticket requirements. For the current pilot, resolve the unidentified test failure, independent Linux install, live SMTP/upload, and any advertised demo checks.
- Do not infer external acceptance from local tests or contributor rehearsals.
- Run `yarn install --frozen-lockfile`, `yarn typecheck:golar`, `yarn typecheck`, `yarn build`, and `yarn test`. Require tag CI to pass on the same source.
- Record commands, results, environment, blockers, and artifact identity in tickets. Exclude credentials, private addresses, local paths, temporary test IDs, and private backup details.

## 3. Prepare Version And Changelog

- Use `year.major.patch`; update `package.json` and `CHANGELOG.md` together.
- Review commits and diffs since the latest tag. Include only verified, user-relevant changes; do not claim unfinished or untested features.
- Keep the entry `Unreleased` until publication, then add the release date. Update relevant install, upgrade, and support docs. Keep the roadmap high-level, without ticket links.

## 4. Stage And Audit Artifacts

- Build for each advertised OS/architecture. The current pilot target is Linux x64.
- `yarn stage:release` builds the app and removes `.output` after staging; preserve any build output you still need.
- Audit the archive for the installer, `.env.example`, Quickstart, server entrypoint, and runtime dependencies. Ensure it excludes live config, credentials, databases, backups, and user media.
- Generate and verify the SHA-256 checksum. Record the archive name, digest, source commit, platform, and environment in the release ticket.
- Advertise only platforms and workflows supported by evidence.

## 5. Update Records And Commit

- Update tickets and roadmap with verified evidence; leave unmet and publication gates open.
- Review `git status` and the staged diff. Exclude unrelated changes and generated files.
- Run relevant checks. Commit only with authorization and follow repo conventions. The release commit must contain the version/changelog and intended release changes; require a clean tree before tagging.
- Ensure the archive matches the release commit. If source changes, rerun affected checks and restage it.

## 6. Tag And Publish

- Verify all gates pass, the release commit is correct, and `v<version>` does not exist. Never move or reuse a published tag.
- With user authorization, tag and push the release commit. A `v*` push triggers CI and publishes the GitHub Release.
- After CI passes, confirm the release points to the right tag and has the expected archive and checksum. Download the asset, verify its checksum, and test the published install instructions.
- Record actual results in the changelog, tickets, roadmap, release notes, and support entrypoints. Mark publication complete only after verification.

## 7. Correct Or Withdraw

- If validation or publication fails, record it; do not replace assets silently or retag different source.
- Correct or withdraw a published release with a new version/tag and clear notice. Preserve prior evidence and direct operators to the corrected release.

## Completion Report

Report the version, commit/tag, assets and checksums, CI/install results, ticket status, and limitations. Distinguish staging from publication.