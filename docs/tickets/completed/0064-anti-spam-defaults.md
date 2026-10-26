# Ticket 0064: Define Anti-Spam Defaults

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Define documented baseline anti-spam defaults for posting frequency, media limits, and report thresholds.

## Requirements
- [x] Recommended defaults cover posting frequency, media limits, and report thresholds.
- [x] Defaults include rationale and guidance for small communities.
- [x] Documentation distinguishes baseline recommendations from configurable community policy.

## Tasks
- [x] Audit existing rate limits, media constraints, and report handling thresholds.
- [x] Select and document recommended baseline values and rationale.
- [x] Identify enforcement paths that need to consume these defaults.

## Notes
- Recommendations are documented in `docs/Architecture.md`; they are not a claim that all paths are currently enforced.
- Configurable per-community defaults and broader write-path enforcement remain separate work in Tickets 0066 and 0065.
- The existing `moderation.threshold` value applies to moderator requests, not report prioritization.

## Relevant Files
- docs/Architecture.md
- server/middleware/protection.ts
- server/utils/media.ts
- server/assets/schema.surql
- server/api/report/send.ts
- server/api/post/add.ts
- server/api/thread/add.ts

## Progress Log
- 2026-10-25: Documented small-community recommendations for post/thread frequency, media sizes, and report prioritization, with rationale and a distinction from current enforcement and future community settings.
- 2026-10-25: Audited current request limits, media caps, report routes, and moderation threshold references. Existing report threshold behavior is absent; the configured moderation threshold applies to requests, not reports.
- 2026-10-25: Ticket created.