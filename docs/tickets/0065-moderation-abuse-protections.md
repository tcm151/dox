# Ticket 0065: Expand Moderation-Adjacent Abuse Protections

## Status
- State: Planned
- Priority: High
- Next: Inventory moderation-adjacent write endpoints and their current protections

## Dependencies
- [0064](0064-anti-spam-defaults.md): Baseline anti-spam values should guide enforcement limits.

## Goal
Apply appropriate rate limits and abuse protections to moderation-adjacent write paths, including report submission and report handling.

## Requirements
- [ ] In-scope write paths have documented, server-enforced abuse limits.
- [ ] Limits use the established request identity and rate-limit mechanisms.
- [ ] Tests cover allowed requests, rejected excess requests, and authorization boundaries.

## Tasks
- [ ] Inventory moderation-adjacent write endpoints and existing protections.
- [ ] Add or adjust rate limits and abuse checks for uncovered paths.
- [ ] Add focused tests for the protections and authorization behavior.

## Notes
- Keep limits aligned with the baseline defined in Ticket 0064.

## Relevant Files
- server/middleware/protection.ts
- server/api/report/send.ts
- server/api/topic/[topic]/reports.ts
- tests/parallel/moderation.test.ts

## Progress Log
- 2026-10-25: Ticket created.