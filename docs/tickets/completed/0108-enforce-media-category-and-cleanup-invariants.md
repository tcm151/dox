# Ticket 0108: Enforce Media Category And Cleanup Invariants

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Reject cross-category uploads and ensure every accepted media file has a valid deletion path. Prevent refunded files and permanently failing trash entries from accumulating or starving legitimate cleanup.

## Requirements
- [x] Image uploads accept only supported image formats, and audio uploads accept only supported audio formats; misleading MIME labels and invalid file contents are rejected before persistent writes or token charges.
- [x] Disabling a media category cannot be bypassed by submitting its files through another category's endpoint.
- [x] Every accepted media type and extension combination is supported by storage, serving, and cleanup.
- [x] Existing mismatched media records, files, and trash entries have an explicit, safe repair path without duplicate refunds or deletion of referenced media.
- [x] Permanently failing trash entries cannot prevent later eligible entries from being processed, while failures remain visible to operators.
- [x] Regression coverage checks token balances, stored records, file removal, retries, and cleanup progress with more than one worker batch of invalid entries.

## Tasks
- [x] Constrain processing dispatch to the requested media category and validate actual file content.
- [x] Align persisted media and trash constraints with the accepted formats, including an upgrade path where existing databases need repair.
- [x] Repair or isolate existing unsupported cleanup entries without silently discarding their files or work.
- [x] Ensure cleanup advances past persistently failing entries while retaining diagnostics and retryability.
- [x] Add focused upload, refund, and cleanup regression tests.
- [x] Update media and operator documentation for the accepted formats and repair behavior.

## Notes
- Upload routes now validate category-specific MIME types and actual content before charging tokens or persisting records; cleanup supports known legacy cross-category suffixes in each table's original directory.
- Failed cleanup attempts retain their files and queue records, record diagnostics, and become eligible again after ten minutes. Operators can inspect and safely requeue repaired entries using [Backups.md](../../Backups.md).
- Related completed work: Tickets 0001 and 0052. Audio publication remains separate under Ticket 0042.

## Relevant Files
- server/utils/media.ts
- server/utils/mediaFormat.ts
- server/utils/mediaCleanup.ts
- server/api/image/upload.ts
- server/api/audio/upload.ts
- server/assets/schema.surql
- server/assets/migrations/
- shared/types/index.ts
- tests/parallel/media.server.test.ts
- docs/API.md
- docs/Architecture.md
- docs/Backups.md

## Progress Log
- 2026-11-17: Enforced media category/content validation and retryable cleanup; migration probes, focused tests, and typecheck passed. Full suite remains blocked by the unrelated feed-availability timeout.
- 2026-11-17: Ticket created from the public-launch source review. No executable validation was performed.
