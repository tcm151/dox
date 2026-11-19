# ClassicForum Developer Roadmap

Marker legend: 🟥 `Not Started` | 🟦 `In Progress` | 🟩 `Done`  
Effort legend: `S` (1-2 days), `M` (3-5 days), `L` (1-2 weeks)  

See [tickets](tickets/) for individual tasks, dependencies, and validation results.

Done means the listed work is complete, not that every release or deployment check has passed.

## Phase A: Self-Hosting Basics

Goal: make self-hosting reliable, with embedded SurrealDB as the default and remote mode available for larger deployments.

### A1. CI and Tests
- 🟩 Add GitHub Actions pipeline for install, type-check, build, and smoke tests. (`M`)
- 🟩 Add minimal server/API smoke tests for auth, post create, thread reply, and report flow. (`L`)
- 🟩 Add PR template + contribution checks (tests/docs checklist). (`S`)
- 🟩 Add browser-based UI integration suite for mounted pages, rendered markup, and user workflows. (`M`)

**Success metric**: every PR is validated by CI and critical flows have automated smoke coverage.

### A2. Installation
- 🟩 Add `.env.example` with embedded defaults and remote-mode advanced examples. (`S`)
- 🟩 Add single “Production Quickstart” doc for a Linux VM service install, with embedded as the default and operator-managed reverse proxy/TLS. (`M`)
- 🟩 Add a SurrealDB user guide linking upstream documentation and documenting ClassicForum-specific database configuration. (`M`)

**Success metric**: clean machine setup to running app in <= 30 minutes.

### A3. Security
- 🟩 Expand rate limiting coverage beyond auth endpoints to referral, reporting, and media uploads. (`M`)
- 🟩 Validate award tokens and prevent duplicate spending across user, post, and thread awards. (`M`)
- 🟩 Add referral abuse limits (cooldown/one-time constraints). (`M`)
- 🟩 Add security policy + responsible disclosure doc. (`S`)

**Success metric**: no known P0 abuse paths in auth/economy endpoints.

### A4. Operations
- 🟩 Add [backup/restore runbook](Backups.md) for embedded and remote SurrealDB modes; isolated WSL restore and backup-first upgrade/recovery validation is complete. (`M`)
- 🟩 Add health/readiness endpoint docs and operator checks for embedded and remote profiles. (`S`)
- 🟩 Add release versioning + changelog process. (`S`)

**Success metric**: operator can recover data/service from documentation alone.

## Phase B: Moderation and Community Trust

Goal: make moderation decisions consistent, easy to review, and fair for small communities.

### B1. Moderation Workflows
- 🟩 Ensure moderation queue/report triage is complete and documented. (`M`)
- 🟩 Add moderation action log/audit trail MVP (who, what, when, reason, target). (`L`)
- 🟩 Add appeal workflow MVP with status transitions and resolution notes. (`L`)

**Success metric**: moderation decisions are traceable end-to-end and can be appealed with predictable outcomes.

### B2. Abuse Controls and Safety Defaults
- 🟩 Define anti-spam defaults (posting frequency, media limits, report thresholds). (`M`)
- 🟩 Expand rate limiting and abuse protections across moderation-adjacent write paths. (`M`)
- 🟩 Enforce feedback availability and configured anonymous submissions. (`M`)
- 🟩 Add configurable per-topic moderation defaults with documented recommended presets. (`M`)
- 🟩 Add content tagging and visibility policy controls (NSFW/spoiler defaults and user overrides). (`M`)

**Success metric**: operators can configure moderation defaults without changing code.

### B3. Moderator and User Experience
- 🟩 Complete or hide remaining unfinished moderation and messaging workflows. (`M`)
- 🟩 Add user-visible moderation state where appropriate (locked content, appeal status, action context). (`M`)
- 🟩 Keep moderation and report result states consistent with awaited datasource conventions. (`M`)
- 🟩 Add conversation controls for lock/slow-mode/report handling across threads and comments. (`L`)

**Success metric**: moderation UX is understandable for both moderators and affected users.

## Phase C: Accounts, Discovery, and Publishing

Goal: finish the core account, discovery, and publishing workflows before expanding into other content types or advanced editor features.

### C1. API Documentation and Error Logging
- 🟩 Publish the API endpoint inventory with auth requirements and response contracts. (`M`)
- 🟩 Add contract tests for high-risk routes (auth, moderation, media upload, vote/report). (`L`)
- 🟩 Add structured, redacted handled-error context and request correlation for API errors. Successful-request logging is deferred. (`M`)

**Success metric**: contributors can identify API contracts and evaluate changes to core routes against tested behavior.

### C2. Account Safety and Personal Controls
- 🟩 Add account deletion choices for retaining authored content or removing it while preserving discussion history. (`M`)
- 🟩 Add revoke-other-sessions action, session expiry, and password-reset invalidation. (`M`)
- 🟩 Add user/topic block and mute controls with feed/search filtering and server-side action enforcement. (`M`)
- 🟩 Add save/unsave actions for eligible content with clear saved-state feedback. (`M`)
- 🟩 Enforce global and per-type voting availability in vote APIs. (`M`)
- 🟩 Align extra-option actions across supported content types while preserving authorization and intentional exceptions. (`M`)
- 🟩 Define account privacy controls and documented defaults, distinct from content visibility settings. (`S`)
- 🟩 Implement the agreed profile audience control for profile details, social data, and profile-feed aggregation. (`M`)
- 🟩 Add configurable email and in-app notification preference controls in user settings. (`M`)

**Success metric**: users can secure their accounts, manage core privacy and visibility choices, and control unwanted interactions without moderator intervention.

### C3. Discovery and Inbox Reliability
- 🟥 Persist feed and comment sorting preferences across devices. (`S`)
- 🟩 Add search filters and URL synchronization for shareable discovery. (`M`)
- 🟩 Enforce configured availability for dedicated feeds and Home routes. (`M`)
- 🟥 Rank content from saved users without changing which content appears in the following feed. (`M`)
- 🟩 Audit existing inbox and notification workflows for consistent state, authorization, navigation, and test coverage. (`M`)
- 🟩 Refresh feeds and inbox after relevant changes and on new navigation when data is stale, without clearing loaded content. (`M`)
- 🟥 Triage high-visibility TODOs in feed/search/settings and create linked follow-up work. (`S`)
- 🟥 Restore vote-state animation after confirming vote transitions retrigger the feedback. (`S`)

**Success metric**: feed and inbox state stays understandable and current, with shareable discovery and reliable polling as the baseline.

### C4. Core Content Publishing
- 🟩 Complete thread editor parity with post editor for supported publishing, preview, validation, and upload workflows. (`M`)
- 🟩 Add first-class link publishing. (`M`)
- 🟩 Add link detail and feed integration after the foundation; it does not depend on optional metadata previews. (`M`)
- 🟩 Enforce server-side post/thread publishing rules and moderator request eligibility. (`M`)
- 🟥 Complete audio publication, then detail/feed/playback and cleanup. (`L`)

**Success metric**: core link and audio publishing paths are complete end to end, including visibility, moderation, feed integration, and media cleanup; deferred content types are not presented as supported workflows.

**Phase C exit criteria**: core account, discovery, inbox, link, and audio workflows are usable and tested; API contracts are documented; unfinished optional publishing paths remain disabled or clearly unavailable.

## Phase D: Release Preparation and Early Adoption

Goal: fix the remaining public-use issues, check the release and installation process, and help a small group of operators try ClassicForum.

Fix release-blocking issues before promotion. Code cleanup can run in parallel. Other cleanup and optional features do not block the pilot unless they affect supported workflows.

Current release: 2026.6.5. The demo redirects stopped after production moved from Node `22.14.0` to `24.22.3`. [Ticket 0128](tickets/completed/0128-verify-demo-navigation-and-hydration.md) records the investigation. Independent installation, live SMTP/onboarding, hosting measurements, future release checks, and diagnosis of an unidentified test failure remain open. Verify the download, take a fresh backup, and get approval before deploying a future release.

### D1. Security and Reliability
- 🟩 Fix media cleanup, confirmation-token validation, and confirmation-email rate limits without changing ownership or refund rules.
- 🟩 Apply mute/block filters consistently and limit discovery and inbox query sizes.
- 🟩 Keep requests tied to the correct account and discard cancelled edits.
- 🟥 Normalize remaining mutation loading, error, and retry lifecycles.

**Success metric**: known release-blocking defects are fixed, account data stays isolated, and tests cover failures and limits.

### D2. Code Consistency
- 🟥 Share useful request types between client and server, and accurately type query results, record references, and form state.
- 🟥 Reuse validation and error handling, and keep complex writes in the appropriate managers.
- 🟥 Type UI events, clean up subscriptions, and reuse record-navigation helpers and isolated test accounts.

**Success metric**: a contributor can follow a route from its input types through validation, manager logic, and focused tests.

### D3. Releases and Installation
- 🟦 Diagnose the unidentified test-run failure; missing media/referral failure, retry, and concurrency coverage has been added.
- 🟦 Complete the independent operator's Linux install check; WSL service, reverse-proxy, backup-first upgrade, and isolated restore rehearsals passed.
- 🟥 Check real SMTP delivery for confirmations, password resets, and opted-in notifications, then test confirmed-account image uploads.
- 🟥 Publish platform-specific archives with matching source tags, checksums, and release notes. Document tested environments, measured resource use, and known limits.

**Success metric**: an operator can download and verify the correct archive, then install, upgrade, and restore the app using the published instructions.

### D4. Demo and Support
- 🟥 Fix public demo navigation and rendering problems, and show only checked features.
- 🟥 Add a short introduction, representative examples, and clear Demo, Install, and Get Help links.
- 🟥 Explain how to get help and report bugs safely, state support limits, and document recurring questions from pilot operators.

**Success metric**: three external installations, with at least two still used for publishing or discussion after 30 days. Demo registrations or a server staying online do not count.

**Phase D exit criteria**: supported workflows are tested, downloads can be verified, installation and recovery instructions work, support limits are clear, and pilot feedback guides the next fixes. Unfinished Phase C work, including audio, remains on the roadmap even if it is outside the pilot.

## Phase E: Community Funding (Deferred)

Goal: add optional community funding after installation, moderation, and core workflows are reliable.

### E1. Checkout and Community Funding
- 🟥 Replace placeholder purchase flow with feature-flagged checkout architecture. (`L`)
- 🟥 Define purchase and reward accounting with idempotent requests and abuse checks, reusing existing referral protections. (`M`)
- 🟥 Add operator-facing policy docs for community funding controls and moderation implications. (`S`)

Referral protections are already implemented. Checkout and community funding remain unfinished.

**Success metric**: community funding can be enabled without weakening abuse protections or moderation rules.