---
name: release
description: "Use for ClassicForum release preparation or publication: versioning, changelogs, acceptance gates, artifacts, commits, tags, GitHub Releases, and corrections."
argument-hint: "Optional target version or release ticket"
---

# CI-Driven Release Workflow

CI owns release validation, archive creation, checksum generation, and GitHub Release publication. Prepare a clean, tested source commit; do not manually stage or upload release artifacts unless the user specifically asks for a local rehearsal or CI recovery.

## 1. Establish Scope

- Read the project guide, roadmap, release ticket, relevant install/support notes, `.github/workflows/ci.yml`, `package.json`, and `CHANGELOG.md`.
- Check the latest version tag, its commit, current branch, complete `git status`, and commits since that tag. Preserve unrelated work.
- Confirm the target version, supported platforms, release claims, and whether the user authorized pushing a tag. A local tag alone does not trigger CI.
- Treat the CI workflow as the source of truth for release assets and publication. Confirm its current trigger and steps rather than relying on remembered behavior.

## 2. Prepare The Candidate

- Review every change since the latest release tag. Include only verified, user-relevant changes; keep unfinished work and unverified claims out of the changelog.
- Use `year.major.patch`. When changing the application version, update `package.json` and `CHANGELOG.md` together.
- Finish and commit intended code, tests, and documentation changes first. Keep generated output and unrelated changes out of the release source.
- Update and date the release's changelog entry in a dedicated final commit. That changelog commit must be the exact commit tagged for release; do not add another source commit after it.
- Before tagging, require `HEAD` to be that commit, the worktree and index to be clean, the changelog version/date to match the package version, and `v<version>` not to exist.

## 3. Validate Locally

- Run the same required checks as CI: `yarn install --frozen-lockfile`, `yarn typecheck:golar`, `yarn typecheck`, `yarn build`, and `yarn test`.
- Record exact commands, results, environment, and any remaining limitations in the relevant tickets. Do not claim external installation, provider delivery, demo behavior, or production deployment from local tests.
- Keep separately tracked operational checks visible. Do not mark them complete without evidence; whether they block a tag is a release-scope decision, not a reason to duplicate CI's package build locally.

## 4. Tag And Let CI Publish

- Confirm the clean candidate commit, matching package/changelog version, passing local checks, and absent tag. Never move or reuse a published tag.
- Create the version tag on the final changelog commit. Push the tag only when the user has authorized triggering the release workflow; a pushed `v*` tag runs validation, verifies the tag matches `package.json`, builds the configured Linux x64 archive, creates its SHA-256 file, and publishes both through GitHub Releases.
- Do not run `yarn stage:release` or manually create/upload a GitHub Release as part of the normal workflow. Use those only when explicitly requested or needed to diagnose CI.
- After CI completes, confirm it passed on the tagged commit and that the GitHub Release contains the expected archive and checksum. Record CI and asset results in the release ticket. Production installation remains a separate operation requiring a fresh backup and explicit approval.

## 5. Correct Or Withdraw

- If CI validation or publication fails, record the failure and repair the source through a new commit. Do not silently replace published assets or retag different source.
- Correct or withdraw a published release with a new version/tag and a clear notice. Preserve prior evidence and direct operators to the corrected release.

## Completion Report

Report the version, final changelog commit and tag, clean-tree status, local checks, CI result, published assets/checksum, ticket status, and remaining operational limitations. Distinguish a local tag from a pushed tag and a prepared candidate from a published release.