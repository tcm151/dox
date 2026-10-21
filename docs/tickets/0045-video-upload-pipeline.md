# Ticket 0045: Video Upload Pipeline

## Status
- State: Planned
- Priority: Medium
- Next: Implement the `Video` contract and schema from the decisions recorded in Ticket 0044.

## Dependencies
- [0044](0044-video-delivery-architecture.md): Upload processing needs the chosen video formats, delivery approach, and resource limits.

## Goal
Provide a secure, observable video upload pipeline that validates media, records ownership and cost, persists files, and supports staged publication without partial state.

## Requirements
- [ ] Shared types, schema, and migrations define the same video and upload-state fields.
- [ ] Confirmed users can upload only supported video files within configured limits.
- [ ] Successful uploads can be played through an authenticated staged-media route before publication.
- [ ] Database, filesystem, token, thumbnail, and derived-metadata changes remain consistent on success and failure.
- [ ] Rate, size, duration, and processing limits return actionable errors and are covered by focused tests.

## Tasks
- [ ] Add the `Video` contract, schemafull table, permissions, computed fields, and migration behavior.
- [ ] Extend media validation and storage around the formats and processing strategy selected in Ticket 0044.
- [ ] Add authenticated upload handling with settings, trait, size, duration, and token checks.
- [ ] Implement byte-range delivery for staged video with ownership or privileged-role authorization.
- [ ] Generate and persist required metadata and thumbnail assets.
- [ ] Add cancellation and orphan cleanup with atomic or compensating token and file behavior.
- [ ] Cover malformed media, unsupported codecs, oversized uploads, interrupted processing, insufficient tokens, and successful playback.

## Notes
- The existing `MediaType` union and processing utility support only image and audio; video should follow the chosen design rather than merely adding another switch branch.

## Relevant Files
- shared/types/index.ts
- server/assets/schema.surql
- server/assets/migrations.surql
- server/utils/media.ts
- server/api/image/upload.ts
- server/api/audio/upload.ts
- server/middleware/protection.ts

## Progress Log
- 2026-09-28: Ticket created.
