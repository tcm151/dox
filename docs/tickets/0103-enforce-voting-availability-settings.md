# Ticket 0103: Enforce Voting Availability Settings

## Status
- State: Planned
- Priority: Medium
- Next: Define the disabled-voting response and vote-reset behavior.

## Dependencies
- [0098](completed/0098-audit-appsettings-usage-and-gaps.md): The settings audit confirmed that vote APIs do not enforce the voting controls.

## Goal
Enforce the global and per-vote-type AppSettings in vote APIs so hidden vote controls cannot be bypassed with direct requests.

## Requirements
- [ ] `voting.enabled` prevents users from adding or changing any vote when disabled.
- [ ] `voting.misleading` and `voting.negative` prevent only their corresponding vote types when disabled.
- [ ] Users can still clear their own existing vote while voting is disabled.
- [ ] Existing vote data is preserved when a setting is disabled.
- [ ] Focused tests cover all vote types, disabled settings, resets, and unauthorized requests.

## Tasks
- [ ] Add server-side settings checks to the positive, misleading, and negative vote APIs.
- [ ] Preserve and document reset behavior for users removing existing votes.
- [ ] Add focused API tests for global and per-type setting combinations.

## Notes
- Client control visibility remains a convenience; the API is authoritative.

## Relevant Files
- app/components/system/tags/Votes.vue
- server/api/vote/[id]/positive.ts
- server/api/vote/[id]/misleading.ts
- server/api/vote/[id]/negative.ts
- server/api/vote/[id]/reset.ts
- tests/parallel/votes.server.test.ts

## Progress Log
- 2026-11-13: Ticket created.