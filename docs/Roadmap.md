# OpenForum Developer Roadmap

Status legend: `Not Started` | `In Progress` | `Blocked` | `Done`  
Priority legend: `P0` (critical), `P1` (high), `P2` (medium)  
Effort legend: `S` (1-2 days), `M` (3-5 days), `L` (1-2 weeks)  

## Phase A: Engineering Baseline (Quality, Security, Operations)

Goal: establish strong production and contributor foundations.

### A1. CI + Test Baseline
- `P0` Add GitHub Actions pipeline for install, type-check, build, and smoke tests. (`M`)
- `P0` Add minimal server/API smoke tests for auth, post create, thread reply, and report flow. (`L`)
- `P1` Add PR template + contribution checks (tests/docs checklist). (`S`)

**Success metric**: every PR is validated by CI and critical flows have automated smoke coverage.

### A2. Install/Deploy Simplicity
- `P0` Add `Dockerfile` + `docker-compose.yml` for app + SurrealDB quickstart. (`L`)
- `P1` Add `.env.example` with documented defaults. (`S`)
- `P0` Add single “Production Quickstart” doc (Linux VM + reverse proxy + TLS). (`M`)

**Success metric**: clean machine setup to running app in <= 30 minutes.

### A3. Security Hardening (Critical Paths)
- `P0` Expand rate limiting coverage beyond current auth endpoints. (`M`)
- `P0` Fix award flow token validation + anti-double-spend guardrails. (`M`)
- `P0` Add referral abuse limits (cooldown/one-time constraints). (`M`)
- `P1` Add security policy + responsible disclosure doc. (`S`)

**Success metric**: no known P0 abuse paths in auth/economy endpoints.

### A4. Ops Essentials
- `P0` Add backup/restore runbook for both remote and embedded SurrealDB modes. (`M`)
- `P1` Add health/readiness endpoint docs and operator checks. (`S`)
- `P1` Add release versioning + changelog process. (`S`)

**Success metric**: operator can recover data/service from documentation alone.

## Phase B: Product & Developer Experience

Goal: reduce friction for maintainers, contributors, and self-host developers.

### B1. Onboarding and Contributor Flow
- `P1` Add first-run admin checklist (account, roles, settings, moderation baseline). (`M`)
- `P1` Improve first user -> admin/developer bootstrap path (reduce manual query steps). (`M`)
- `P1` Add architecture overview doc (routing, data model, auth/session, migrations). (`M`)

**Success metric**: new contributor can run, understand, and modify core flows in <= 1 day.

### B2. Moderation and Safety Completeness
- `P1` Ensure moderation queue/report triage is complete and documented. (`M`)
- `P1` Add moderation action log/audit trail MVP. (`L`)
- `P2` Define anti-spam defaults (posting frequency, media limits, report thresholds). (`M`)

**Success metric**: moderation actions are consistent and traceable.

### B3. UI/UX Completion for Core Paths
- `P1` Complete or hide unfinished messaging UI areas to avoid beta behavior in production. (`M`)
- `P2` Resolve high-visibility TODOs affecting trust in core pages. (`M`)
- `P2` Add empty/error/loading state consistency pass on main user flows. (`M`)

**Success metric**: no obvious incomplete features in default user/admin paths.

## Phase C: Platform Maturity (Scale, Extensibility, Maintainability)

Goal: make OpenForum easier to operate at scale and safer to evolve.

### C1. Observability and Performance
- `P1` Add structured request logging for API and error contexts. (`M`)
- `P1` Define baseline metrics and operational SLOs (latency, error rate, migration success). (`M`)
- `P2` Add lightweight performance benchmark script for critical feed and thread endpoints. (`M`)

**Success metric**: performance and error regressions are detectable before production incidents.

### C2. API and Contract Stability
- `P1` Publish API endpoint inventory with auth requirements and response contracts. (`M`)
- `P1` Add contract tests for high-risk routes (auth, media upload, vote/report). (`L`)
- `P2` Define deprecation/versioning policy for breaking API changes. (`S`)

**Success metric**: API changes are intentional and backward-compatibility is trackable.

### C3. Extensibility and Internal Architecture
- `P1` Document extension points (middleware, server utilities, component conventions). (`M`)
- `P1` Refactor high-churn modules with clear ownership boundaries. (`L`)
- `P2` Add coding standards and “definition of done” for feature PRs. (`S`)

**Success metric**: feature work lands faster with fewer regressions and cleaner diffs.

## 4) Milestones

1. CI pipeline live; `.env.example` committed; production quickstart draft.
2. Docker/deploy path validated on clean machine; initial smoke tests pass.
3. Security fixes for award/referral/rate limits merged.
4. Backup/restore drill completed; v0.1 engineering-baseline release tagged.
5. Admin onboarding + contributor architecture docs published.
6. Moderation workflow + audit log MVP documented.
7. Incomplete UX areas cleaned/hid; quality pass for core flows.
8. v0.2 developer-experience release tagged.
9. Structured logging + baseline metrics established.
10. API contract inventory and tests merged.
11. Extensibility docs + coding standards finalized.
12. v0.3 platform-maturity release tagged with regression trend summary.