# Ticket 0026: CI Pipeline Baseline

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Add a baseline CI pipeline that validates install, type-check, build, and core smoke checks on every PR.

## Requirements
- [x] CI runs on pull requests and default branch pushes.
- [x] Pipeline includes install, type-check, build, and smoke checks.
- [x] Failed checks block merge by policy.

## Tasks
- [x] Add a GitHub Actions workflow for baseline checks.
- [x] Wire package scripts for CI-friendly execution.
- [x] Document CI expectations in contribution docs.
- [x] Require the CI check in GitHub branch protection settings.

## Notes
- Keep first pass reliable and fast before expanding matrix coverage.
- The initial smoke check can verify application startup and health. Ticket 0027 adds the broader API flow suite once the pipeline exists.
- The workflow targets the current default branch, `dev`, and runs the existing integration suite, which starts the app and checks `/api/health` before its test phases.
- Branch protection is configured in GitHub repository settings and cannot be enforced by the workflow file.

## Relevant Files
- package.json
- golar.config.ts
- .github/workflows/ci.yml
- .github/copilot-instructions.md
- docs/ContributionGuide.md

## Progress Log
- 2026-10-25: Configured GitHub branch protection rules to require CI; all ticket requirements are complete.
- 2026-10-25: Added the PR and `dev` push workflow with install, Golar and Nuxt typechecks, build, and integration health/test checks. Branch protection remains to be enabled in GitHub settings.
- 2026-04-13: Ticket created.