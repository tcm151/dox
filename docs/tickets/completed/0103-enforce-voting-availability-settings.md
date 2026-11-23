# Ticket 0103: Enforce Voting Availability Settings

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Enforce the global and per-vote-type AppSettings in vote APIs so hidden vote controls cannot be bypassed with direct requests.

## Requirements
- [x] `voting.enabled` prevents users from adding or changing any vote when disabled.
- [x] `voting.misleading` and `voting.negative` prevent only their corresponding vote types when disabled.
- [x] Users can still clear their own existing vote while voting is disabled.
- [x] Existing vote data is preserved when a setting is disabled.
- [x] Focused tests cover all vote types, disabled settings, resets, and unauthorized requests.

## Tasks
- [x] Add server-side settings checks to the positive, misleading, and negative vote APIs.
- [x] Preserve and document reset behavior for users removing existing votes.
- [x] Add focused API tests for global and per-type setting combinations.

## Notes
- Client control visibility remains a convenience; the API is authoritative.
- Disabled vote attempts return `403`; unauthenticated requests remain `401`. The reset action remains available and removes only the caller's existing vote, without clearing stored votes when a setting is disabled.

## Relevant Files
- app/components/system/tags/Votes.vue
- server/api/vote/[id]/positive.ts
- server/api/vote/[id]/misleading.ts
- server/api/vote/[id]/negative.ts
- server/api/vote/[id]/reset.ts
- tests/parallel/votes.server.test.ts
- tests/sequential/11-voting-availability.server.test.ts

## Progress Log
- 2026-11-17: Completed vote-availability enforcement and API coverage. `yarn test --sequential` passed (28/28), `yarn test --server` passed (179/179), and `yarn typecheck` passed.
- 2026-11-17: Chose `403` for disabled vote attempts while preserving reset behavior, then began server-side enforcement.
- 2026-11-13: Ticket created.