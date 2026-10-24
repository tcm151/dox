# Ticket 0047: Poll Creation Model and Publishing

## Status
- State: Planned
- Priority: Medium
- Next: Define radio, checkbox, and free-text response semantics and limits before writing the poll schema.

## Goal
Define and implement a durable poll contract so the existing poll editor can publish validated questions, response rules, options, topics, and optional expiration.

## Requirements
- [ ] Poll type semantics, option limits, expiration, result visibility, and editability are documented.
- [ ] Shared types and the SurrealDB schema represent the same poll creation fields and lifecycle state.
- [ ] Authenticated users can publish valid polls from `/editor/poll` when polls are enabled.
- [ ] Invalid questions, duplicate or empty options, unsupported response rules, and invalid expiration are rejected server-side.
- [ ] A newly published poll can be fetched by ID and the editor navigates to its canonical route.

## Tasks
- [ ] Decide whether free-text responses are in the initial scope and define their moderation and visibility behavior.
- [ ] Define radio and checkbox selection limits, option count and length limits, expiration, closure, and result visibility.
- [ ] Add the `Poll` contract, schemafull table, permissions, computed fields, and required migration behavior.
- [ ] Add authenticated create and read-by-ID routes with settings and server-side validation.
- [ ] Align the editor fields and preview with the final contract and connect its submit action.
- [ ] Cover valid creation, response-type rules, duplicate options, expiration, disabled settings, and unauthenticated requests.

## Notes
- The editor UI currently offers radio, checkbox, and input modes, but there is no poll type, schema, or API.
- This ticket establishes poll creation only. Response mutation and result calculation belong to Ticket 0048.
- Draft support remains out of scope per completed Ticket 0011.

## Relevant Files
- app/pages/editor/poll.vue
- shared/types/index.ts
- shared/utils/validation.ts
- server/assets/schema.surql
- server/assets/migrations/
- docs/Roadmap.md

## Progress Log
- 2026-09-28: Ticket created.
