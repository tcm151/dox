---
name: release
description: "Use for ClassicForum release preparation or publication: versioning, changelogs, acceptance gates, artifacts, commits, tags, GitHub Releases, and corrections."
argument-hint: "Optional target version or release ticket"
---

# CI-Driven Release Workflow

CI owns release validation, archive creation, checksum generation, and GitHub Release publication. Prepare a clean, tested source commit; do not manually stage or upload release artifacts unless the user specifically asks for a local rehearsal or CI recovery.

## 1. Establish Scope

- Read the project guide, roadmap, release ticket, relevant install/support notes, `.github/workflows/pipeline.yml`, `.github/workflows/release.yml`, `package.json`, and `CHANGELOG.md`.
- Check the latest version tag, its commit, current branch, complete `git status`, and commits since that tag. Preserve unrelated work.
- Confirm the target version, supported platforms, release claims, and whether the user authorized pushing a tag. A local tag alone does not trigger CI.
- Treat the CI workflow as the source of truth for release assets and publication. Confirm its current trigger and steps rather than relying on remembered behavior.

## 2. Prepare The Candidate

- Review every change since the latest release tag. Include only verified, user-relevant changes; keep unfinished work and unverified claims out of the changelog.
- Use `year.major.patch`. When changing the application version, update `package.json` and `CHANGELOG.md` together.
- Keep `server/assets/migrations/<version>.surql` aligned with each application release. If a release has no schema or data changes, add a transactional version-marker-only migration with a replay-safe `UPSERT` so existing databases advance to the release version and the current-migration replay route has a file to run.
- Keep changelog sections focused on product changes under the existing `Added`, `Changed`, `Fixed`, and `Security` categories as relevant. Do not add a separate `Release` metadata section; put operator scope, limitations, and support guidance in their owning documentation.
- Finish and commit intended code, tests, and documentation changes first. Keep generated output and unrelated changes out of the release source.
- For a new application release, update and date the changelog entry in a dedicated final source commit and tag that commit. For an authorized CI-only recovery before publication, a fix commit may follow the existing release changelog commit without a new changelog entry, provided the package version and existing changelog section remain accurate; follow Section 5.
- Push the final release commit to `dev` and wait for the Pipeline workflow to pass before tagging. The tag must point to that exact validated commit.
- For an initial tag, require `HEAD` to be that commit, the worktree and index to be clean, the changelog version/date to match the package version, and `v<version>` not to exist. For recovery after a failed pre-publication CI run, follow Section 5.

## 3. Validate Locally

- Run the same required checks as CI: `yarn install --frozen-lockfile`, `yarn typecheck:golar`, `yarn typecheck`, `yarn build`, and `yarn test`.
- Record exact commands, results, environment, and any remaining limitations in the relevant tickets. Do not claim external installation, provider delivery, demo behavior, or production deployment from local tests.
- Keep separately tracked operational checks visible. Do not mark them complete without evidence; whether they block a tag is a release-scope decision, not a reason to duplicate CI's package build locally.

## 4. Tag And Let CI Publish

- Before tagging, confirm that `HEAD` is the clean release commit and that the Pipeline workflow passed on `dev` for that exact commit. If the commit changes after the Pipeline passes, push the new commit to `dev` and wait for the Pipeline to pass before tagging.
- For an initial release, also confirm the matching package/changelog version and absent tag. Never move or reuse a tag for which a GitHub Release has been created. A failed pre-publication release may be retagged only under Section 5.
- Create the version tag on the validated release commit. Push it only when the user has authorized triggering the Release workflow; it requires a successful Pipeline run on `dev` for the exact commit, verifies the tag matches `package.json`, builds the configured Linux x64 archive, creates its SHA-256 file, and publishes both through GitHub Releases. Release notes use the unique dated `CHANGELOG.md` section matching the tag version; a missing or duplicate section fails publication.
- Do not run `yarn stage:release` or manually create/upload a GitHub Release as part of the normal workflow. Use those only when explicitly requested or needed to diagnose CI.
- After CI completes, confirm it passed on the tagged commit and that the GitHub Release contains the expected archive and checksum. Record CI and asset results in the release ticket. Production installation remains a separate operation requiring a fresh backup and explicit approval.

## 5. Correct Or Withdraw

- If CI fails before a GitHub Release is created, preserve the failed run and repair the source through a new commit. Push the fixed commit to `dev` and wait for the Pipeline workflow to pass. After confirming no GitHub Release exists for the version and the package/changelog still match it, retarget `v<version>` to that validated commit and push it to rerun the Release workflow, but only with explicit user authorization. A CI-only correction does not require a version bump or a new changelog entry.
- If a GitHub Release has been created, do not move or reuse its tag or silently replace its assets. Correct or withdraw it with a new version/tag and a clear notice. Preserve prior evidence and direct operators to the corrected release.

## Completion Report

Report the version, final changelog commit and tag, clean-tree status, local checks, successful Pipeline run on `dev` for the tagged commit, Release workflow result, published assets/checksum, ticket status, and remaining operational limitations. Distinguish a local tag from a pushed tag and a prepared candidate from a published release.