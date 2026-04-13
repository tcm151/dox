# ClassicForum Developer Roadmap

Marker legend: 🟥 `Not Started` | 🟦 `In Progress` | 🟩 `Done`  
Effort legend: `S` (1-2 days), `M` (3-5 days), `L` (1-2 weeks)  

## Phase A: Self-Host Baseline (Quality, Security, Operations)

Goal: make self-hosting reliable by default, with embedded SurrealDB as the primary deployment path and remote mode documented as advanced scale.

### A1. CI + Test Baseline
- 🟥 Add GitHub Actions pipeline for install, type-check, build, and smoke tests. (`M`)
- 🟥 Add minimal server/API smoke tests for auth, post create, thread reply, and report flow. (`L`)
- 🟥 Add PR template + contribution checks (tests/docs checklist). (`S`)

**Success metric**: every PR is validated by CI and critical flows have automated smoke coverage.

### A2. Install/Deploy Simplicity
- 🟩 Add `.env.example` with embedded defaults and remote-mode advanced examples. (`S`)
- 🟥 Add single “Production Quickstart” doc (Linux VM + reverse proxy + TLS), with embedded as default path. (`M`)
- 🟥 Add a separate “Remote SurrealDB at Scale” operations guide (networking, credentials, failure modes). (`M`)

**Success metric**: clean machine setup to running app in <= 30 minutes.

### A3. Security Hardening (Critical Paths)
- 🟦 Expand rate limiting coverage beyond current auth endpoints. (`M`)
- 🟦 Fix award flow token validation + anti-double-spend guardrails. (`M`)
- 🟦 Add referral abuse limits (cooldown/one-time constraints). (`M`)
- 🟥 Add security policy + responsible disclosure doc. (`S`)

**Success metric**: no known P0 abuse paths in auth/economy endpoints.

### A4. Ops Essentials
- 🟥 Add backup/restore runbook for both remote and embedded SurrealDB modes. (`M`)
- 🟥 Add health/readiness endpoint docs and operator checks for embedded and remote profiles. (`S`)
- 🟥 Add release versioning + changelog process. (`S`)

**Success metric**: operator can recover data/service from documentation alone.

## Phase B: Moderation and Community Trust

Goal: make moderation outcomes consistent, reviewable, and fair for small niche communities.

### B1. Moderation Workflow Completeness
- 🟦 Ensure moderation queue/report triage is complete and documented. (`M`)
- 🟥 Add moderation action log/audit trail MVP (who, what, when, reason, target). (`L`)
- 🟥 Add appeal workflow MVP with status transitions and resolution notes. (`L`)

**Success metric**: moderation decisions are traceable end-to-end and can be appealed with predictable outcomes.

### B2. Abuse Controls and Safety Defaults
- 🟦 Define anti-spam defaults (posting frequency, media limits, report thresholds). (`M`)
- 🟦 Expand rate limiting and abuse protections across moderation-adjacent write paths. (`M`)
- 🟥 Add shadow-quarantine flow for suspicious first-time users with limited visibility and interaction. (`M`)
- 🟥 Add configurable per-community moderation defaults with documented recommended presets. (`M`)
- 🟥 Add admin controls for content visibility policy (NSFW/spoiler/sensitive content defaults). (`M`)

**Success metric**: communities can apply sane moderation defaults without custom engineering.

### B3. Moderator and User Experience Hardening
- 🟦 Complete or hide unfinished moderation and messaging UI areas to avoid beta behavior in production. (`M`)
- 🟥 Add user-visible moderation state where appropriate (locked content, appeal status, action context). (`M`)
- 🟦 Add empty/error/loading state consistency pass on moderation and report surfaces. (`M`)
- 🟥 Add topic governance tools (rename/archive/lock, moderator assignment, rules/summary history, and featured/pinned topic content). (`L`)
- 🟥 Add conversation controls for lock/slow-mode/report handling across threads and comments. (`L`)

**Success metric**: moderation UX is understandable for both moderators and affected users.

## Phase C: Product and DX for Modern Async Communities

Goal: deliver modern, fluid async interactions while improving contributor productivity.

### C1. User Control and Account Safety
- 🟦 Add revoke-all-sessions capability and session management UI for account safety. (`M`)
- 🟥 Add block/mute controls for users, topics, and keywords with clear UX. (`L`)
- 🟦 Add privacy and notification preference controls with documented defaults. (`M`)
- 🟥 Add configurable email and in-app notification preference controls in user settings. (`M`)

**Success metric**: users can control their experience and account risk without moderator intervention.

### C2. Fluid Async Discovery and Inbox UX
- 🟥 Add saved/custom feed presets and URL-synced filter state for search/discovery. (`L`)
- 🟦 Improve async refresh behavior for inbox/feed (polling, optimistic updates, stale-state handling). (`M`)
- 🟦 Resolve high-visibility TODOs affecting trust in feed/search/settings core paths. (`M`)
- 🟥 Add optional realtime notification delivery mode (SSE/WebSocket) after polling baseline is stable. (`L`)

**Success metric**: core browse and notification workflows feel modern without requiring full realtime infrastructure.

### C4. Advanced Authoring Experience
- 🟥 Add scheduled publish support for posts and threads. (`M`)
- 🟥 Add richer poll creation (multiple options, expiration, and result display states). (`M`)
- 🟥 Add rich link/article/video embed support with preview rendering. (`M`)
- 🟥 Add side-by-side markdown preview with debounced rendering controls. (`M`)
- 🟥 Add series/collection grouping for related posts and threads. (`L`)
- 🟥 Add revision history for posts/threads with moderator review and revert capabilities. (`L`)
- 🟥 Complete thread editor parity with post editor, including draft and mention workflows. (`M`)

**Success metric**: advanced content creation workflows are consistent across editor types and safe for moderation.

### C3. Contributor and Contract Stability
- 🟥 Publish API endpoint inventory with auth requirements and response contracts. (`M`)
- 🟥 Add contract tests for high-risk routes (auth, moderation, media upload, vote/report). (`L`)
- 🟦 Add structured request logging for API and error contexts. (`M`)
- 🟥 Define baseline metrics and operational SLOs (latency, error rate, migration success). (`M`)

**Success metric**: changes to core async and moderation flows are safer to ship and easier to maintain.

## Phase D: Long-Term Monetization (Deferred)

Goal: enable optional community funding after core ops, trust, and UX priorities are stable.

### D1. Store and Funding Foundations
- 🟥 Replace placeholder purchase flow with feature-flagged checkout architecture. (`L`)
- 🟦 Implement referral/reward redemption hardening with idempotency and abuse protections. (`M`)
- 🟥 Add operator-facing policy docs for community funding controls and moderation implications. (`S`)

**Success metric**: monetization can be safely enabled without compromising core community trust.