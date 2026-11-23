# Ticket 0084: Topic Rename Requests

## Status
- State: Deferred
- Priority: Medium
- Next: Resume canonical-ID rename design and migration after the data/reference impact is reviewed

## Goal
Allow topic moderators to request a rename and authorized reviewers to decide that request without losing the topic's content or history.

## Requirements
- [ ] Assigned moderators can submit a validated rename request for their topic.
- [ ] Authorized reviewers can approve or reject requests, with the outcome visible to the requester and reviewers.
- [ ] An approved rename preserves topic content, moderator assignments, rules, history, and references; existing topic links continue to resolve.
- [ ] Tests cover authorization, validation, request decisions, and preservation of topic data and links.

## Tasks
- [ ] Define whether renaming changes a display name, canonical topic ID, or both, including the behavior of existing URLs.
- [ ] Implement persistence, validation, and role-gated request and decision APIs.
- [ ] Add request and review UI to the topic profile and moderator tools.
- [ ] Add focused API and UI coverage for the rename workflow.

## Notes
- The Request Rename control in the topic profile is currently a placeholder.
- Keep any canonical-ID migration compatible with topic references and previously shared links.
- The current preference is to change the canonical topic ID and preserve previous URLs through aliases or redirects; this contract is not yet designed or implemented.

## Relevant Files
- app/pages/topic/[topic]/tools/profile.vue
- server/api/topic/[topic]/
- server/api/moderator/request/
- server/assets/schema.surql
- shared/types/index.ts

## Progress Log
- 2026-11-17: Aligned State with the previously recorded user-requested pause, documented existing prerequisites, and updated the tools path. Work was not resumed.
- 2026-11-11: Paused at the user's request after reviewing the record-ID migration complexity; canonical-ID rename with legacy URL compatibility remains the preferred direction.
- 2026-11-11: Ticket created.
