# Ticket 0030: Remote SurrealDB Operations Guide

## Status
- State: Todo
- Priority: Medium
- Next action: Define remote deployment assumptions and failure modes

## Goal
Create an operations guide for remote SurrealDB deployments covering networking, credentials, and common failure handling.

## Done Looks Like
- [ ] Guide documents secure remote connectivity and env setup.
- [ ] Failure modes and recovery checks are clearly listed.
- [ ] Guide differentiates remote mode from embedded default flow.

## Tasks
- [ ] Draft remote mode setup and hardening guidance.
- [ ] Add troubleshooting matrix for auth/network/namespace issues.
- [ ] Link from contribution and architecture docs.

## Notes
- Treat this as advanced scale path documentation.

## Relevant Files
- [docs/ContributionGuide.md](../ContributionGuide.md)
- [docs/Architecture.md](../Architecture.md)
- [server/utils/database.ts](../../server/utils/database.ts)
- [docs/.env.example](../.env.example)

## Progress Log
- 2026-04-13: Ticket created.
