# Architecture

Purpose: provide a single, implementation-grounded architecture reference for contributors.

## 1. Product and System Overview

OpenForum is a self-hosted forum platform built as a Nuxt 4 full-stack app with SurrealDB.

High-level architecture:
- Frontend: Nuxt app under `app/` (pages, layouts, components, stores, plugins)
- Backend: Nitro server under `server/` (API routes, middleware, plugins, utilities)
- Data contracts: shared TypeScript interfaces under `shared/types/`
- Persistence: SurrealDB schema and migrations under `server/assets/`
- Static/public assets: `public/` and media files written to `MEDIA_PATH`

Deployment model:
- Single process app serving UI + API
- SurrealDB mode can be:
  - `remote` via RPC
  - `embedded` via node engines in-process

## 2. Repository Boundaries

### 2.1 Frontend (`app/`)

- `app/app.vue`: global shell, top-level initialization, modal orchestration
- `app/pages/`: file-based routes
- `app/layouts/`: layout variants (`default`, `middle`, `simple`)
- `app/components/`: shared UI and feature-specific components
- `app/utils/`: composables/stores (`session`, `settings`, `cache`, `events`, etc.)
- `app/plugins/`: client/runtime plugins (directives, error handling, markdown)
- `app/assets/scss/`: global styles, variables, mixins, animation/spacing definitions

### 2.2 Backend (`server/`)

- `server/api/`: HTTP route handlers (auth, content, moderation, admin, developer)
- `server/middleware/protection.ts`: global request protection (rate limiting)
- `server/plugins/01.migrations.server.ts`: startup schema/migration sync and bootstrap logic
- `server/plugins/errorHandler.ts`: server-side error capture/logging
- `server/plugins/cleanup.ts`: shutdown cleanup
- `server/routes/cdn/`: media delivery endpoints
- `server/utils/`: backend service layer (auth, database, media, email, settings)
- `server/assets/schema.surql`: schema definitions and table-level rules
- `server/assets/migrations.surql`: migration statements run at startup

### 2.3 Shared (`shared/`)

- `shared/types/index.ts`: core contracts used by UI and API
- `shared/utils/`: cross-boundary helpers (`roles`, `validation`, `traits`, etc.)

## 3. Runtime Topology and Lifecycle

### 3.1 Nuxt runtime

Nuxt runs in SSR mode by default with selected route groups configured as CSR-only in `nuxt.config.ts` route rules (admin/developer/editor/moderator/settings style routes).

Boot sequence:
1. App process starts, runtime config loaded from env.
2. Database connection is initialized lazily through `DatabaseQuery` usage.
3. Startup plugin `01.migrations.server.ts` applies schema + migrations.
4. Optional default admin user is created if configured and user table is empty.
5. Client bootstraps shell (`app/app.vue`) and loads app settings store.

### 3.2 Frontend initialization path

In `app/app.vue`, the shell initializes:
- SEO metadata
- App settings fetch (`useSettings().refresh()`)
- Global UI events for login/user manager/feedback/popup
- Window viewport CSS variable management for mobile height correctness

### 3.3 API request path

Typical API request lifecycle:
1. Incoming request enters Nitro.
2. Global middleware (`server/middleware/protection.ts`) may enforce route-specific rate limit.
3. Route handler in `server/api/**` executes.
4. Handlers authenticate (when required) through `authenticateRequest`.
5. Data access runs through `DatabaseQuery` (SurrealQL + parameters/record IDs).
6. Errors are surfaced with `createError` and logged by Nitro error handler plugin.

## 4. Data Architecture

### 4.1 Type contract model

Core interfaces live in `shared/types/index.ts` and include:
- `User`, `Account`, `Session`
- `Post`, `Comment`, `Thread`, `Draft`
- `Topic`, `Pin`, `Notification`, `Feedback`, `Report`
- `Image`, `Audio`
- `AppSettings`

Design pattern:
- Most content entities implement vote/score semantics via `Voteable` and `Sortable` style interfaces.
- IDs use Surreal record IDs (`table:id` shape) and are commonly represented as `TYPE & string`.

### 4.2 Schema ownership

`server/assets/schema.surql` is authoritative for:
- Table definitions and field constraints
- Computed fields
- Record relations
- Uniqueness/index constraints

`server/assets/migrations.surql` is for incremental data/schema updates that must execute at startup.

### 4.3 Core entities and relationships (conceptual)

- `user` owns authored entities and links to account records
- `account` stores credentials and links identity to a `user`
- `session` links auth token identity to an `account`
- `topic` connects to `post` and `thread` for taxonomy/discovery
- `post` contains title/content and may include comments/images
- `thread` supports chain/reply patterns and quoting
- `report` references moderation targets
- `feedback` captures product input
- `appSettings` controls runtime behavior toggles
- `error` stores structured server failures for diagnostics

## 5. Authentication and Authorization

Auth implementation resides in `server/utils/auth.ts`:
- `SessionManager.add`: creates session + cleanup of stale/invalidated sessions
- `authenticateLogin`: credential verification and session issue
- `authenticateToken`: token-to-session lookup and fetch account + user context
- `authenticateRequest`: standard guard for protected handlers
- `invalidateSession`: logout/invalidation path

Client auth state is managed in `app/utils/session.ts`:
- Token persistence in local/session storage
- Profile hydration via `/api/profile`
- Login/logout flows and event publication

Roles:
- `admin`
- `developer`
- `moderator`

Role checks are applied in route handlers and page middleware as needed.

## 6. Content, Moderation, and Feedback Flows

### 6.1 Content flows

- Posts, comments, threads, and drafts have dedicated API endpoints under `server/api/`.
- Voting endpoints operate per target ID (`/api/vote/[id]/*`).
- Discovery/feed endpoints aggregate content for major browse views.

### 6.2 Moderation/reporting

- Reports are created through report endpoints and surfaced in admin routes.
- Topic moderation/request features exist and are evolving.
- Moderation state and workflows are partly implemented and should be validated before broad feature additions.

### 6.3 Feedback

- Feedback submission and dismissal flows are wired through `server/api/feedback/**` and related admin views.

## 7. Media Pipeline

Media path components:
- Upload API handlers: `server/api/image/upload.ts`, `server/api/audio/upload.ts`
- Processing/writing: `server/utils/media.ts`
- Serving: `server/routes/cdn/image/**` and `server/routes/cdn/audio/**`

Flow:
1. Client uploads file.
2. Server validates/processes media.
3. DB record is created/updated.
4. File is written to filesystem.
5. CDN route serves file and associated metadata/visit flows.

Operational note:
- File lifecycle management (including cleanup consistency with DB deletion) must be considered when modifying media behavior.

## 8. Configuration and Settings

Runtime configuration is defined in `nuxt.config.ts` and env variables.

Key env groups:
- App identity and URL: `PORT`, `BASE_URL`, titles
- Media storage path: `MEDIA_PATH`
- Surreal connection: `SURREAL_TYPE`, `SURREAL_URL`, namespace/database, credentials
- Default admin bootstrap: `DEFAULT_USER_*`
- SMTP: optional email delivery settings

`AppSettings` runtime configuration is persisted in DB and exposed through settings APIs and admin settings UI.

## 9. Error Handling and Observability

Server-side:
- `server/plugins/errorHandler.ts` captures errors and writes structured records to DB.

Client-side:
- `app/plugins/errorHandler.ts` and hint systems expose user-facing feedback.

Current posture:
- Error capture exists.
- Broader observability (metrics/SLO dashboards, endpoint-level performance traces) is a roadmap area.

## 10. Security Model (Current Fundamentals)

Present controls:
- Session-based authentication
- Role gates for privileged routes/actions
- Global rate limiting middleware for auth and email confirmation endpoints
- Referral token grants are idempotent and constrained to one claim per claimant account
- Server-side validation and controlled mutation patterns through API handlers

Important engineering expectation:
- Any new write endpoint should explicitly evaluate abuse vectors (rate limit, replay, role/auth checks, idempotency, and state constraints).

## 11. Startup, Migrations, and Bootstrap

`server/plugins/01.migrations.server.ts` guarantees startup synchronization:
- Reads schema + migrations from server assets storage
- Executes both before normal runtime activity
- Optionally seeds default admin if configured
- Throws blocking startup error if migration fails

Contributor rule:
- Schema-impacting features should update both TypeScript contracts and Surreal schema/migrations together.

## 12. Contributor Working Model

### 12.1 Invariants (Do Not Violate)

- All API writes must go through authenticated/authorized handlers where required.
- Shared types and Surreal schema must stay aligned.
- Changes touching data shape should consider migration impact.
- Do not bypass `DatabaseQuery` conventions unless there is a strong justification.
- Keep route and component placement aligned with Nuxt 4 app-directory conventions.

### 12.2 Change Impact Map

If you change auth/session:
- Update `server/utils/auth.ts`
- Validate `app/utils/session.ts`
- Re-check role guards across relevant `app/pages/**` and `server/api/**`

If you change data entities:
- Update `shared/types/index.ts`
- Update `server/assets/schema.surql`
- Add migration logic in `server/assets/migrations.surql` when needed
- Validate all API handlers using those records

If you change settings behavior:
- Update settings APIs under `server/api/settings/**` or `server/api/admin/settings/**`
- Update `server/utils/settings.ts`
- Update `app/utils/settings.ts` and admin settings pages

If you change media:
- Update upload handlers, processing utilities, and CDN routes together
- Validate token/permission implications

### 12.3 Expected Review Checklist

Before merging architectural changes:
1. Is auth/role enforcement still correct?
2. Are schema and shared types still synchronized?
3. Are startup migrations still idempotent and safe?
4. Are CSR/SSR assumptions still correct for changed routes?
5. Are failure paths clear and logged?
6. Did docs in `docs/` stay consistent with implementation?

## 13. Known Gaps and Active Evolution Areas

Areas known to be evolving (reference roadmap for priority):
- CI and automated test coverage baseline
- Expanded rate-limiting and abuse controls
- Moderation/audit completeness
- UX completion in some feature surfaces
- Ops maturity (health/readiness, backup/restore, release process)
- API contract documentation and stability practices

Treat these as architecture constraints when designing new features:
- Prefer incremental hardening over broad surface expansion.
- Prioritize backward-compatible data and API changes.

## 14. Practical Onboarding Path

Recommended order for new contributors:
1. Read `docs/ContributionGuide.md`
2. Read this document (`docs/Architecture.md`)
3. Inspect `nuxt.config.ts` and `shared/types/index.ts`
4. Trace one end-to-end flow:
   - UI page in `app/pages/**`
   - API endpoint in `server/api/**`
   - Query logic in `server/utils/database.ts`
   - Schema fields in `server/assets/schema.surql`
5. Make smallest safe change first, then expand.

## 15. Glossary

- Nitro: Nuxt server runtime used for API and server middleware/plugins.
- SurrealQL: query language used by SurrealDB.
- Record ID: Surreal identifier in `table:id` shape.
- CSR-only route: route rendered client-side only (no SSR) per Nuxt route rules.
- Bootstrap admin: optional first user generated from env on startup.

---

If this document drifts from implementation, implementation is authoritative. Update this file in the same PR as architectural changes.
