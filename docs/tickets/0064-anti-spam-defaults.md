# Ticket 0064: Define Anti-Spam Defaults

## Status
- State: Planned
- Priority: Medium
- Next: Audit current posting, media, and reporting limits

## Goal
Define documented baseline anti-spam defaults for posting frequency, media limits, and report thresholds.

## Requirements
- [ ] Recommended defaults cover posting frequency, media limits, and report thresholds.
- [ ] Defaults include rationale and guidance for small communities.
- [ ] Documentation distinguishes baseline recommendations from configurable community policy.

## Tasks
- [ ] Audit existing rate limits, media constraints, and report handling thresholds.
- [ ] Select and document recommended baseline values and rationale.
- [ ] Identify enforcement paths that need to consume these defaults.

## Notes
- Configurable per-community defaults and implementation of broader write-path protections are tracked in Tickets 0066 and 0065.

## Relevant Files
- server/middleware/protection.ts
- server/api/report/send.ts
- docs/Architecture.md

## Progress Log
- 2026-10-25: Ticket created.