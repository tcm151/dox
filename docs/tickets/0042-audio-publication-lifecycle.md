# Ticket 0042: Audio Publication Lifecycle

## Status
- State: Planned
- Priority: Medium
- Next: Define the schemafull audio record and staged-upload state used before publication.

## Goal
Turn the existing raw audio upload into a complete publication flow that persists title, description, topics, ownership, visibility, and file state consistently.

## Requirements
- [ ] Audio records are governed by a schemafull table aligned with the shared `Audio` contract.
- [ ] Successful uploads remain private until the editor publishes valid metadata and at least one topic.
- [ ] The audio editor can publish its uploaded file and navigate to the canonical audio route.
- [ ] Disabled uploads, invalid media, insufficient tokens, and invalid publication payloads fail without orphaning inconsistent state.
- [ ] Abandoned staged uploads have a documented cleanup and token-refund path.

## Tasks
- [ ] Extend the `Audio` contract with publication metadata and visibility or staging state.
- [ ] Define the audio table, field constraints, permissions, computed URL and score, and required migration behavior.
- [ ] Keep upload validation and token charging aligned with the configured audio upload limit.
- [ ] Add an authenticated finalize or publish operation for title, description, topics, and visibility.
- [ ] Connect `/editor/audio` to publication success, failure, retry, removal, and navigation states.
- [ ] Add focused coverage for upload, publish, retry, abandoned upload, token accounting, and disabled settings.

## Notes
- `server/api/audio/upload.ts` currently creates an unmanaged audio record and writes the file immediately, while the editor cannot publish its metadata.
- Use the image media flow as a reference, but do not duplicate the consistency gap tracked by Ticket 0001.
- Draft support remains out of scope per completed Ticket 0011.

## Relevant Files
- app/pages/editor/audio.vue
- app/utils/media.ts
- shared/types/index.ts
- server/api/audio/upload.ts
- server/assets/schema.surql
- server/assets/migrations.surql
- server/utils/media.ts

## Progress Log
- 2026-09-28: Ticket created.
