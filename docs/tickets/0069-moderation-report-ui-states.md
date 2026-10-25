# Ticket 0069: Standardize Moderation And Report UI States

## Status
- State: Planned
- Priority: Medium
- Next: Audit empty, loading, and error behavior on moderation and report surfaces

## Goal
Make empty, loading, and error states consistent and actionable across moderation and report surfaces.

## Requirements
- [ ] Queue and report views show clear loading, empty, and recoverable error states.
- [ ] Errors preserve useful context and provide a recovery action where possible.
- [ ] State behavior is consistent across moderator and topic report views.

## Tasks
- [ ] Audit moderation and report surfaces for missing or inconsistent states.
- [ ] Add consistent empty, loading, and error handling.
- [ ] Verify the states for empty data, delayed responses, and failed requests.

## Notes
- Messaging UI workflow completeness is tracked separately in Ticket 0067.

## Relevant Files
- app/pages/moderator.vue
- app/pages/topic/[topic]/reports.vue

## Progress Log
- 2026-10-25: Ticket created.