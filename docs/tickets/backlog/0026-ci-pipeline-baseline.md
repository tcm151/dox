# Ticket 0026: CI Pipeline Baseline

## Status
- State: Planned
- Priority: High
- Next: Define first CI workflow stages and trigger rules

## Goal
Add a baseline CI pipeline that validates install, type-check, build, and core smoke checks on every PR.

## Requirements
- [ ] CI runs on pull requests and default branch pushes.
- [ ] Pipeline includes install, type-check, build, and smoke checks.
- [ ] Failed checks block merge by policy.

## Tasks
- [ ] Add GitHub Actions workflow file(s) for baseline checks.
- [ ] Wire package scripts for CI-friendly execution.
- [ ] Document CI expectations in contribution docs.

## Notes
- Keep first pass reliable and fast before expanding matrix coverage.
- The initial smoke check can verify application startup and health. Ticket 0027 adds the broader API flow suite once the pipeline exists.

## Relevant Files
- package.json
- .github/copilot-instructions.md
- docs/ContributionGuide.md

## Progress Log
- 2026-04-13: Ticket created.
