# Ticket 0039: Link Publishing Foundation

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Make links a first-class content type with a title, URL, and optional metadata preview. Links should otherwise participate in the same feeds, topics, votes, and discussion as posts.

## Requirements
- [x] Shared types and the SurrealDB schema define the same Link shape, including title, URL, preview metadata, topics, and engagement fields.
- [x] Authenticated users can publish valid HTTP or HTTPS links with at least one topic from `/editor/link`.
- [x] Invalid payloads, disabled link publishing, and unauthorized requests are rejected server-side, including exact 4-128 title-length bounds.
- [x] A newly published link can be fetched by ID and the editor navigates to its canonical route.

## Tasks
- [x] Define the `Link` contract, including author, title, URL, topics, timestamps, votes, score, and visits.
- [x] Add the schemafull `link` table, field constraints, and required migration statements.
- [x] Add authenticated create and read-by-ID API routes with server-side URL, title-type, and topic validation.
- [x] Enforce the `links.enabled` setting in the create route.
- [x] Connect the editor submit action to the create API and handle success and failure states.
- [x] Add focused API coverage for valid creation, malformed URLs, missing topics, disabled settings, and unauthenticated requests.
- [x] Enforce exact 4-128 character title bounds across request, schema, and editor validation; add API boundary tests.
- [x] Document Link creation and read contracts, side effects, and tests in `docs/API.md`.

## Notes
- The editor submits title, URL, topics, and tags, then navigates to `/link/:id`; the detail page supports visits, votes, and discussion.
- The Link record includes optional preview metadata. Safe remote metadata fetching and preview generation are tracked in [Ticket 0040](0040-safe-link-metadata-previews.md).
- Restrict the initial URL scheme to HTTP and HTTPS.
- Draft support remains out of scope per completed Ticket 0011.

## Relevant Files
- app/pages/editor/link.vue
- app/pages/link/[id].vue
- app/components/system/previews/LinkPreview.vue
- shared/types/index.ts
- server/assets/schema.surql
- server/assets/migrations/2026.6.3.surql
- server/api/link/add.ts
- server/api/link/[id].ts
- server/utils/ModerationManager.ts
- tests/parallel/links.server.test.ts
- tests/sequential/03-settings.setup.test.ts
- docs/API.md

## Progress Log
- 2026-11-14: Completed Link publishing, including exact request and database title bounds. API and direct database boundary coverage pass in the full suite.
- 2026-11-14: Review confirmed API and editor title bounds, but a disposable database probe accepted a 129-character Link title under the current schema assertion; schema-level enforcement remains open.
- 2026-11-13: Completed exact title-bound validation and API boundary coverage; documented Link create, read, and visit contracts.
- 2026-11-13: Implemented Link create/read APIs, setting and cooldown enforcement, editor submission, detail/feed rendering, and focused API coverage. Link schema changes are in migration 2026.6.3. Title-length boundary validation and detailed API documentation remain.
- 2026-11-13: Added the shared Link contract, fresh schema, versioned migration, and title/URL editor form. The migration applies and replays from 2026.6.3; API publishing is next.
- 2026-09-28: Ticket created.
