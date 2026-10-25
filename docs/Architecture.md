# Architecture

This document explains how ClassicForum is structured and how its main pieces fit together.

## 1. Product and System Overview

ClassicForum is a self-hosted forum platform built as a Nuxt 4 full-stack app with SurrealDB.

High-level architecture:
- Frontend: Nuxt app under `app/` (pages, layouts, components, stores, plugins)
- Backend: Nitro server under `server/` (API routes, middleware, plugins, utilities)
- Data contracts: shared TypeScript interfaces under `shared/types/`
- Persistence: SurrealDB schema and migrations under `server/assets/`
- Static/public assets: `public/` and media files written to `DATA_PATH`

Deployment model:
- Single process app serving UI + API
- SurrealDB mode can be:
  - `remote` via RPC (see [SurrealDB](SurrealDB.md))
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
- `server/plugins/01.startup.server.ts`: startup schema/migration sync, default account setup, and health status
- `server/middleware/00.startup.ts`: blocks requests until startup is ready and serves the unavailable response
- `server/plugins/errorHandler.ts`: server-side error capture/logging
- `server/plugins/cleanup.ts`: stops scheduled tasks and closes the database on shutdown
- `server/routes/cdn/`: media delivery endpoints
- `server/utils/`: backend service layer (auth, database, media, email, settings, scheduled tasks)
- `server/assets/schema.surql`: schema definitions and table-level rules
- `server/assets/migrations/<version>.surql`: ordered, versioned migrations

### 2.3 Shared (`shared/`)

- `shared/types/index.ts`: core contracts used by UI and API
- `shared/utils/`: cross-boundary helpers (`roles`, `validation`, `traits`, etc.)

## 3. Runtime Topology and Lifecycle

### 3.1 Nuxt runtime

Nuxt runs in SSR mode by default with selected route groups configured as CSR-only in `nuxt.config.ts` route rules (admin/developer/editor/moderator/settings style routes).

Boot sequence:
1. App process starts and loads runtime config from env.
2. Startup sets health to `starting` and initializes the database through `DatabaseQuery`.
3. A fresh database receives `schema.surql`, which records the current app version.
4. Later starts apply versioned migration files newer than the database version, in numeric order. Each file records its version in the same transaction as its changes.
5. A default account is created when the account table is empty. The first account requires all three `DEFAULT_USER_*` values.
6. Startup sets health to `ready`. Until then, `/api/health` remains available and reports the attempted version if a migration fails; after migrations succeed, it reports the app version. Other requests receive a 503 and browser requests use `/unavailable`.
7. The unavailable page bypasses the normal app shell and settings fetch. Normal client startup loads app settings through `app/app.vue`.

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
- `Post`, `Comment`, `Thread`, `Draft`, `Gallery`
- `Topic`, `Pin`, `Notification`, `Feedback`, `Report`
- `Image`, `Audio`
- `AppSettings`

Design pattern:
- Most content entities implement vote/score semantics via `Voteable` and `Sortable` style interfaces.
- IDs use Surreal record IDs (`table:id` shape) and are commonly represented as `TYPE & string`.

### 4.2 Schema ownership

`server/assets/schema.surql` defines:
- Table definitions and field constraints
- Computed fields
- Record relations
- Uniqueness/index constraints

Fresh installs use `server/assets/schema.surql` and record the current app version in the migration version table.

Subsequent starts read `server/assets/migrations/<version>.surql`, apply files newer than the latest applied migration in numeric order, and record each version in its migration transaction. Each migration must be safe to replay. Its version marker must be upserted with a fresh timestamp so replaying an earlier migration moves the database version back and startup reapplies only the later suffix. New migration files should wrap their changes and version upsert in a transaction.

### 4.3 Core Entities and Relationships

- `user` owns authored entities and links to account records
- `account` stores credentials and links identity to a `user`
- `session` links auth token identity to an `account`
- `topic` connects to posts, threads, and galleries for taxonomy/discovery
- `post` contains title/content and may include comments/images
- `thread` supports chain/reply patterns and quoting
- `gallery` publishes a group of uploaded image assets as one feed item
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

- Posts, comments, threads, galleries, and drafts have dedicated API endpoints under `server/api/`.
- Voting endpoints operate per target ID (`/api/vote/[id]/*`).
- Discovery/feed endpoints aggregate content for major browse views.

### 6.2 Moderation/reporting

- Reports are created through report endpoints and surfaced in admin and moderator-facing routes.
- Topic-scoped reporting views exist for moderators (for example, topic report queues under `app/pages/topic/[topic]/reports.vue` backed by `server/api/topic/[topic]/reports.ts`).
- Topic moderation/request features exist and are evolving.
- Some moderation workflows are incomplete. Check existing behavior before building on them.

### 6.3 Feedback

- Feedback submission and dismissal flows are wired through `server/api/feedback/**` and related admin views.

### 6.4 Moderator Role Surface

The moderator role has expanded beyond global moderation pages and now includes topic-level workflows.

Topic moderation currently works as follows:
- Topic-level moderation pages enforce moderator role checks in page middleware.
- Topic-scoped moderation APIs enforce moderator role checks server-side.
- Report review and related-topic moderation flows can be performed from topic surfaces without requiring admin role.

When expanding moderation, keep the moderator/admin boundary clear and document any change in scope.

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
5. The image editor publishes selected image assets together as one gallery. Galleries own publication descriptions, topics, and feed engagement; images remain reusable media assets.
6. CDN route serves file and associated metadata/visit flows.

Media changes must keep filesystem cleanup and database deletion consistent.

## 8. Configuration and Settings

Runtime configuration is defined in `nuxt.config.ts` and env variables.

Key env groups:
- App identity and URL: `PORT`, `NUXT_PUBLIC_BASE_URL`, `NUXT_PUBLIC_SITE_TITLE`, `NUXT_PUBLIC_SITE_TITLE_SHORT`
- Trusted reverse proxies: `NUXT_TRUSTED_PROXIES` (comma-separated IP addresses or narrow CIDRs; empty means no forwarded-header trust)
- Media storage path: `NUXT_DATA_PATH`
- Surreal connection: `NUXT_SURREAL_INFO_TYPE`, `NUXT_SURREAL_INFO_URL`, namespace/database, credentials
- Required first default account: `NUXT_SURREAL_ADMIN_*` (may be blank after an account exists)
- SMTP: optional `NUXT_SMTP_*` email delivery settings

The production installer loads canonical `NUXT_*` values from the shared `.env` and uses the same launch path for systemd and foreground runs. Nuxt reads runtime values on each process start, so changing deployment settings and restarting does not require rebuilding the release. This setup targets fresh deployments; migration of prior environment files is out of scope.

`AppSettings` runtime configuration is persisted in DB and exposed through settings APIs and admin settings UI.

## 9. Error Handling and Observability

Server-side:
- `server/plugins/errorHandler.ts` captures errors and writes structured records to DB.
- `GET /api/health` returns the app health report. It returns `200` only after startup migrations are marked complete and a cheap SurrealDB query succeeds; otherwise it returns `503` with check details.

Client-side:
- `app/plugins/errorHandler.ts` and hint systems expose user-facing feedback.

Errors are captured today. Broader observability, including metrics, SLO dashboards, and endpoint performance traces, remains on the roadmap.

## 10. Security Model

Present controls:
- Session-based authentication
- Role gates for privileged routes/actions
- Global rate limiting middleware for auth and email confirmation endpoints
- Client IPs from `X-Forwarded-For` are used only when the connecting socket is in `NUXT_TRUSTED_PROXIES`; otherwise the socket address is used
- Referral token grants are idempotent and constrained to one claim per claimant account
- Server-side validation and controlled mutation patterns through API handlers
- Developer query tooling is restricted to `developer` role users
- Developer query audit integrity is protected by blocking direct queries against the `developerQuery` table

For every new write endpoint, review rate limits, replay protection, authorization, idempotency, and state constraints.

## 11. Startup, Migrations, and Default Account

`server/plugins/01.startup.server.ts` handles startup setup:
- Reads the fresh schema or pending versioned migrations from server assets storage
- Completes database setup before normal runtime activity
- Starts registered scheduled tasks after migrations; each task runs once before its interval begins
- Creates the required default account when the account table is empty
- Throws a blocking startup error if migrations fail or an empty database lacks complete `DEFAULT_USER_*` values
- Reports startup failures through `/api/health` when Nitro starts far enough to serve it. Earlier failures stop the process before health checks are available.

Startup registers scheduled tasks with `server/utils/scheduledTasks.ts` and starts the manager after migrations and account setup. The manager runs each task once before its interval begins, prevents overlapping executions, and clears intervals and waits for in-flight work before the database closes.

Schema changes must update TypeScript contracts and Surreal schema or migrations together.

## 12. Contributor Working Model

### 12.1 Core Rules

- All API writes must go through authenticated/authorized handlers where required.
- Shared types and Surreal schema must stay aligned.
- Data shape changes must include any required migrations.
- Use `DatabaseQuery` for database access.
- Keep route and component placement aligned with Nuxt 4 app-directory conventions.

### 12.2 Server API Style

- Keep `server/api/**` route handlers thin when behavior can live in a focused `server/utils/**` helper or composable.
- Prefer Nuxt/Nitro auto-import conventions in server routes and utilities unless an explicit import is already the local pattern or needed for clarity.
- Server utilities should expose only the fields and functions needed by callers; keep internal state and intermediate checks private.

### 12.3 Change Impact Map

If you change auth/session:
- Update `server/utils/auth.ts`
- Validate `app/utils/session.ts`
- Re-check role guards across relevant `app/pages/**` and `server/api/**`

If you change data entities:
- Update `shared/types/index.ts`
- Update `server/assets/schema.surql`
- Add a versioned migration in `server/assets/migrations/` when needed
- Validate all API handlers using those records

If you change settings behavior:
- Update settings APIs under `server/api/settings/**` or `server/api/admin/settings/**`
- Update `server/utils/settings.ts`
- Update `app/utils/settings.ts` and admin settings pages

If you change media:
- Update upload handlers, processing utilities, and CDN routes together
- Validate token/permission implications

### 12.4 Expected Review Checklist

Before merging architectural changes:
1. Is auth/role enforcement still correct?
2. Are schema and shared types still synchronized?
3. Are startup migrations still idempotent and safe?
4. Are CSR/SSR assumptions still correct for changed routes?
5. Are failure paths clear and logged?
6. Did docs in `docs/` stay consistent with implementation?

## 13. Known Gaps

Work still in progress:
- CI and automated test coverage baseline
- Expanded rate-limiting and abuse controls
- Moderation/audit completeness
- UX completion in some feature surfaces
- Ops maturity (health/readiness, backup/restore, release process)
- API contract documentation and stability practices

When adding features:
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
- Default account: required first account generated from `DEFAULT_USER_*` values when the account table is empty.

---

Update this document in the same pull request as any architecture change.
