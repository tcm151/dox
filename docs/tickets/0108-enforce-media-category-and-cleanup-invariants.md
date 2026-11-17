# Ticket 0108: Enforce Media Category And Cleanup Invariants

## Status
- State: Planned
- Priority: High
- Next: Add a regression case for audio submitted to the image upload endpoint.

## Goal
Reject cross-category uploads and ensure every accepted media file has a valid deletion path. Prevent refunded files and permanently failing trash entries from accumulating or starving legitimate cleanup.

## Requirements
- [ ] Image uploads accept only supported image formats, and audio uploads accept only supported audio formats; misleading MIME labels and invalid file contents are rejected before persistent writes or token charges.
- [ ] Disabling a media category cannot be bypassed by submitting its files through another category's endpoint.
- [ ] Every accepted media type and extension combination is supported by storage, serving, and cleanup.
- [ ] Existing mismatched media records, files, and trash entries have an explicit, safe repair path without duplicate refunds or deletion of referenced media.
- [ ] Permanently failing trash entries cannot prevent later eligible entries from being processed, while failures remain visible to operators.
- [ ] Regression coverage checks token balances, stored records, file removal, retries, and cleanup progress with more than one worker batch of invalid entries.

## Tasks
- [ ] Constrain processing dispatch to the requested media category and validate actual file content.
- [ ] Align persisted media and trash constraints with the accepted formats, including an upgrade path where existing databases need repair.
- [ ] Repair or isolate existing unsupported cleanup entries without silently discarding their files or work.
- [ ] Ensure cleanup advances past persistently failing entries while retaining diagnostics and retryability.
- [ ] Add focused upload, refund, and cleanup regression tests.
- [ ] Update media and operator documentation for the accepted formats and repair behavior.

## Notes
- Static review traced audio MIME dispatch through the image endpoint to an image-directory MP3 file. Deletion refunds tokens and queues an image/MP3 combination that cleanup rejects.
- Cleanup selects the oldest 100 entries; a full batch of permanently rejected combinations can prevent later legitimate cleanup.
- This is a source-based high-severity security finding, not a runtime-verified exploit.
- Related completed work: [0001](completed/0001-media-delete-atomicity.md) and [0052](completed/0052-image-attachment-ownership-and-refunds.md). Audio publication remains separate under [0042](backlog/0042-audio-publication-lifecycle.md).

## Relevant Files
- server/utils/media.ts
- server/utils/mediaCleanup.ts
- server/api/image/upload.ts
- server/api/audio/upload.ts
- server/assets/schema.surql
- server/assets/migrations/
- tests/parallel/media.server.test.ts
- docs/API.md

## Progress Log
- 2026-11-17: Ticket created from the public-launch source review. No executable validation was performed.
