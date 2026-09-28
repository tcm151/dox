# Ticket 0039: Link Publishing Foundation

## Status
- State: Todo
- Priority: Medium
- Next action: Define the shared `Link` contract and matching SurrealDB table fields.

## Goal
Make links a first-class persisted content type so the existing link editor can validate and publish a URL, title, content, and topics through an authenticated API.

## Done Looks Like
- [ ] Shared types and the SurrealDB schema define the same link record shape.
- [ ] Authenticated users can publish valid HTTP or HTTPS links with at least one topic from `/editor/link`.
- [ ] Invalid payloads, disabled link publishing, and unauthorized requests are rejected server-side.
- [ ] A newly published link can be fetched by ID and the editor navigates to its canonical route.

## Tasks
- [ ] Define the `Link` contract, including author, title, URL, content, topics, timestamps, votes, score, and visits.
- [ ] Add the schemafull `link` table, field constraints, permissions, and any required migration statements.
- [ ] Add authenticated create and read-by-ID API routes with server-side URL, title, content, and topic validation.
- [ ] Enforce the `links.enabled` setting in the create route.
- [ ] Connect the existing editor submit action to the create API and handle success and failure states.
- [ ] Add focused API coverage for valid creation, malformed URLs, missing topics, disabled settings, and unauthenticated requests.

## Notes
- The editor UI and client-side validation already exist, but there is no shared `Link` type, link table, or link API.
- Restrict the initial URL scheme to HTTP and HTTPS. Remote metadata fetching is intentionally deferred to Ticket 0040.
- Draft support remains out of scope per completed Ticket 0011.

## Relevant Files
- app/pages/editor/link.vue
- shared/types/index.ts
- shared/utils/validation.ts
- server/assets/schema.surql
- server/assets/migrations.surql
- server/api/post/add.ts

## Progress Log
<!-- Add newest progress entries first; keep this log in reverse chronological order. -->
- 2026-09-28: Ticket created.