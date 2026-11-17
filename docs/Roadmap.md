# ClassicForum Developer Roadmap

Marker legend: 🟥 `Not Started` | 🟦 `In Progress` | 🟩 `Done`  
Effort legend: `S` (1-2 days), `M` (3-5 days), `L` (1-2 weeks)  

## Phase A: Self-Host Baseline (Quality, Security, Operations)

Goal: make self-hosting reliable, with embedded SurrealDB as the default and remote mode available for larger deployments.

### A1. CI + Test Baseline
- 🟩 Add GitHub Actions pipeline for install, type-check, build, and smoke tests. (`M`)
- 🟩 Add minimal server/API smoke tests for auth, post create, thread reply, and report flow. (`L`)
- 🟩 Add PR template + contribution checks (tests/docs checklist). (`S`)
- 🟩 Add browser-based UI integration suite for mounted pages, rendered markup, and user workflows. (`M`)

**Success metric**: every PR is validated by CI and critical flows have automated smoke coverage.

### A2. Install/Deploy Simplicity
- 🟩 Add `.env.example` with embedded defaults and remote-mode advanced examples. (`S`)
- 🟩 Add single “Production Quickstart” doc for a Linux VM service install, with embedded as the default and operator-managed reverse proxy/TLS. Windows x64 packaged setup is validated; Linux-native VPS validation remains a follow-up. (`M`)
- 🟩 Add a SurrealDB user guide linking upstream documentation and documenting ClassicForum-specific database configuration. (`M`)

**Success metric**: clean machine setup to running app in <= 30 minutes.

### A3. Security Hardening (Critical Paths)
- 🟩 Expand rate limiting coverage beyond auth endpoints to referral, reporting, and media uploads. (`M`)
- 🟩 Fix award flow token validation + anti-double-spend guardrails across user, post, and thread awards. (`M`)
- 🟩 Add referral abuse limits (cooldown/one-time constraints). (`M`)
- 🟩 Add security policy + responsible disclosure doc. (`S`)

**Success metric**: no known P0 abuse paths in auth/economy endpoints.

### A4. Ops Essentials
- 🟩 Add [backup/restore runbook](Backups.md) for embedded and remote SurrealDB modes; isolated WSL restore validation is complete. (`M`)
- 🟩 Add health/readiness endpoint docs and operator checks for embedded and remote profiles. (`S`)
- 🟩 Add release versioning + changelog process. (`S`)

**Success metric**: operator can recover data/service from documentation alone.

## Phase B: Moderation and Community Trust

Goal: make moderation outcomes consistent, reviewable, and fair for small niche communities.

### B1. Moderation Workflow Completeness
- 🟩 Ensure moderation queue/report triage is complete and documented. (`M`)
- 🟩 Add moderation action log/audit trail MVP (who, what, when, reason, target). (`L`)
- 🟩 Add appeal workflow MVP with status transitions and resolution notes. (`L`)

**Success metric**: moderation decisions are traceable end-to-end and can be appealed with predictable outcomes.

### B2. Abuse Controls and Safety Defaults
- 🟩 Define anti-spam defaults (posting frequency, media limits, report thresholds). (`M`)
- 🟩 Expand rate limiting and abuse protections across moderation-adjacent write paths. (`M`)
- 🟩 Add configurable per-topic moderation defaults with documented recommended presets. (`M`)
- 🟩 Add content tagging and visibility policy controls (NSFW/spoiler defaults and user overrides). (`0016`, `M`)

**Success metric**: communities can apply sane moderation defaults without custom engineering.

### B3. Moderator and User Experience Hardening
- 🟩 Complete or hide remaining unfinished moderation and messaging workflows. (`0067`, `M`)
- 🟩 Add user-visible moderation state where appropriate (locked content, appeal status, action context). (`0068`, `M`)
- 🟩 Keep moderation and report result states consistent with awaited datasource conventions. (`0069`, `M`)
- 🟩 Add conversation controls for lock/slow-mode/report handling across threads and comments. (`L`)

**Success metric**: moderation UX is understandable for both moderators and affected users.

## Phase C: Product and DX for Modern Async Communities

Goal: complete a secure, dependable baseline platform before expanding into optional content types and advanced authoring features.

### C1. API Contracts and Operational Signals
- 🟩 Publish the API endpoint inventory with auth requirements and response contracts. (`0021`, `M`)
- 🟩 Add contract tests for high-risk routes (auth, moderation, media upload, vote/report). (`0022`, `L`)
- 🟩 Add structured, redacted handled-error context and request correlation for API errors. Successful-request logging is deferred. (`0023`, `M`)

**Success metric**: contributors can identify API contracts and evaluate changes to core routes against tested behavior.

### C2. Account Safety and Personal Controls
- 🟩 Add account deletion choices for retaining authored content or removing it while preserving discussion history. (`0013`, `M`)
- 🟩 Add revoke-other-sessions action, session expiry, and password-reset invalidation. (`0012`, `M`)
- 🟩 Add user/topic block and mute controls with feed/search filtering and server-side action enforcement. (`0014`, `M`)
- 🟩 Add save/unsave actions for eligible content with clear saved-state feedback. (`0080`, `M`)
- 🟥 Align extra-option actions across content types, coordinating save-action availability with Ticket 0080. (`0087`, `M`)
- 🟩 Define account privacy controls and documented defaults, distinct from content visibility settings. (`0089`, `S`)
- 🟩 Implement the agreed profile audience control for profile details, social data, and profile-feed aggregation. (`0107`, `M`)
- 🟩 Add configurable email and in-app notification preference controls in user settings. (`0008`, `M`)

**Success metric**: users can secure their accounts, manage core privacy and visibility choices, and control unwanted interactions without moderator intervention.

### C3. Discovery and Inbox Reliability
- 🟥 Persist feed and comment sorting preferences across devices. (`0070`, `S`)
- 🟥 Add search filters and URL synchronization for shareable discovery. (`0015`, `M`)
- 🟥 Define and implement saved-user content ranking and feed integration after the engagement fundamentals. (`0105`, `M`)
- 🟩 Audit existing inbox and notification workflows for consistent state, authorization, navigation, and test coverage. (`0083`, `M`)
- 🟩 Refresh feeds and inbox after relevant mutations and on stale fresh navigation, preserving loaded content. (`0060`, `M`)
- 🟥 Triage high-visibility TODOs in feed/search/settings and create linked follow-up work. (`0090`, `S`)
- 🟥 Restore vote-state animation after confirming vote transitions retrigger the feedback. (`0082`, `S`)

**Success metric**: feed and inbox state stays understandable and current, with shareable discovery and reliable polling as the baseline.

### C4. Core Content Publishing
- 🟩 Complete thread editor parity with post editor for supported publishing, preview, validation, and upload workflows. (`0011`, `M`)
- 🟩 Add first-class link publishing. (`0039`, `M`)
- 🟩 Add link detail and feed integration after the foundation; it does not depend on optional metadata previews. (`0041`, `M`)
- 🟩 Enforce server-side post/thread publishing rules and moderator request eligibility. (`0101`, `M`)
- 🟥 Complete audio publication, then detail/feed/playback and cleanup. (`0042`, `0043`, `L`)

**Success metric**: core link and audio publishing paths are complete end to end, including visibility, moderation, feed integration, and media cleanup; deferred content types are not presented as supported workflows.

**Phase C exit criteria**: core account, discovery, inbox, link, and audio workflows are usable and tested; API contracts are documented; unfinished optional publishing paths remain disabled or clearly unavailable.

## Phase D: Long-Term Monetization (Deferred)

Goal: enable optional community funding after core ops, trust, and UX priorities are stable.

### D1. Store and Funding Foundations
- 🟥 Replace placeholder purchase flow with feature-flagged checkout architecture. (`L`)
- 🟥 Implement referral/reward redemption hardening with idempotency and abuse protections. (`M`)
- 🟥 Add operator-facing policy docs for community funding controls and moderation implications. (`S`)

**Success metric**: monetization can be safely enabled without compromising core community trust.