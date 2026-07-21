# Ticket 0026: CI Pipeline Baseline

## Status
- State: Todo
- Priority: High
- Next action: Define first CI workflow stages and trigger rules

## Goal
Add a baseline CI pipeline that validates install, type-check, build, and core smoke checks on every PR.

## Done Looks Like
- [ ] CI runs on pull requests and default branch pushes.
- [ ] Pipeline includes install, type-check, build, and smoke checks.
- [ ] Failed checks block merge by policy.

## Tasks
- [ ] Add GitHub Actions workflow file(s) for baseline checks.
- [ ] Wire package scripts for CI-friendly execution.
- [ ] Document CI expectations in contribution docs.

## Notes
- Keep first pass reliable and fast before expanding matrix coverage.

## Relevant Files
- package.json
- .github/copilot-instructions.md
- docs/ContributionGuide.md

## Progress Log
- 2026-04-13: Ticket created.
