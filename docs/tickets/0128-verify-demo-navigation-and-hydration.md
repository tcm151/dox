# Ticket 0128: Verify Demo Navigation And Hydration

## Status
- State: In Progress
- Priority: High
- Next: Deploy the diagnostic build and reproduce a direct `/about` request; inspect the matching `[route-diagnostic]` log entry.

## Goal
Make the public demonstration a reliable representation of its enabled workflows. Diagnose the recorded route redirects and hydration warning without assuming that each observation is an application defect.

## Requirements
- [ ] Direct entry, browser refresh, and in-app navigation are checked for About, public content, Search, Topics, Threads, and Galleries under the documented demo settings.
- [ ] Unexpected redirects are traced to their actual cause; intentional feature restrictions are documented and reflected in visible navigation.
- [ ] Anonymous visitors can browse the public introduction and representative content without registration, while restricted actions retain their authentication/authorization gates.
- [ ] The recorded initial/feed hydration warning is reproduced and resolved, or its absence and the relevant deployment difference are documented with concrete evidence.
- [ ] Confirmed application defects receive focused isolated browser regressions using the existing harness; configuration/deployment issues receive corresponding operational checks.
- [ ] Evidence records the version, relevant redacted settings, entry URL, expected/final destination, and browser diagnostics without claiming untested publishing or moderation behavior.

## Tasks
- [ ] Capture the observed behavior before changing application code or deployed configuration.
- [ ] Compare direct and client-side navigation with enabled-feature settings and existing route guards.
- [ ] Correct confirmed causes at their owning layer and retain intentional restrictions.
- [ ] Add targeted regressions or deployment checks and repeat the public navigation walkthrough.
- [ ] Update demo instructions and link verified examples for adoption materials.

## Notes
- The 2026-11-17 review recorded route redirects and a hydration warning. `/` intentionally redirects to `/feed`; `/feed` routes to the last available tab and defaults to Home, falling back to the first enabled feed. A redirect to Home is not a defect by itself; record the actual entry URL and expected destination.
- The local navigation browser spec passed 4/4, but does not verify demo routes or deployed settings. The owner identifies `forum.tcmdev.ca` as a personal blog and example deployment, not an onboarding site, and authorized read-only checks on 2026-11-18. Wait for feed content to settle before treating an empty state as a failure.
- Completed [0062](completed/0062-browser-validation-test-suite.md) provides the test infrastructure; it does not establish that a separately deployed demo is correctly configured.
- Keep known suite failures under [0118](0118-close-public-release-validation-gaps.md) and read-state presentation under [0115](0115-distinguish-feed-loading-error-and-empty-states.md).
- Coordinate the checked introduction/content path with [0129](0129-complete-public-adoption-entrypoints.md). Do not build a separate marketing application.
- Production settings/content changes require authorization; prefer isolated reproduction and owned test data.

## Relevant Files
- app/app.vue
- app/pages/about.vue
- app/pages/feed.vue
- app/pages/feed/
- app/utils/settings.ts
- nuxt.config.ts
- tests/parallel/navigation.browser.test.ts

## Progress Log
- 2026-11-18: Added an SSR-only `[route-diagnostic]` warning at the root redirect middleware when the incoming HTTP path is not `/` but Nuxt resolves `/`. It records the request ID, method, query-free request path, and resolved path only; no headers, cookies, or settings are logged. The focused browser test asserts direct `/about` returns HTTP 200 and remains on `/about`; 4/4 selected tests and 12/12 including setup passed. This diagnostic has not been deployed.
- 2026-11-18: On Windows, the focused test runner built and started an isolated app with a fresh embedded test database. The direct `/about` browser check now asserts HTTP 200 and that the final URL remains `/about`; 4/4 selected tests and 12/12 including setup passed. This source-built SSR run does not reproduce production. WSL is not installed, and its installation prompt was cancelled; no production files or settings were changed.
- 2026-11-18: A fresh browser and upstream request reproduced `/about` -> 302 `/feed`; the response request ID had no stored error, while the service log reported Vue Router had no match for `/`. The deployed route table contains `/about`, and the only matching normal `/feed` redirect is the root middleware when `to.fullPath === "/"`. `/contact` returns 200, `/bogus` returns 404, and the existing post API record returns 200. The proxy preserves the request path; routing/page source is unchanged since the release commit, and production/local Vue and Vue Router versions match. The remaining question is why production SSR resolves the request through `/`; no production files or settings were changed.
- 2026-11-18: Read-only inspection found the active `forum.tcmdev.ca` Nginx vhost proxies to `127.0.0.1:8001` without a direct-route redirect. Requests to that upstream for `/about` and `/post/tpacyfrin1gmi8g6vd3y` returned 302 to `/feed`, while `/feed` and `/contact` returned 200. The app process runs from `/root/forum/2026.6.3`; its bundled global route middleware redirects only exact `/`, so the route-specific app response remains unexplained. No production configuration or content was changed.
- 2026-11-18: In the signed-in session, in-app About loaded its public summary, but direct GETs to `/about` and an existing `/post/...` URL returned HTTP 302 with `Location: /feed` and `Server: nginx/1.18.0 (Ubuntu)`; the app then selected remembered `/feed/posts`. About's page has no redirect and local route rules do not explain the responses. Inspect the production proxy rule next; a hydration mismatch was also logged on the settled feed. No configuration or content was changed.
- 2026-11-18: From the populated post detail, in-app footer navigation loaded About with the public summary and Contact with email links and a Feedback form. No feedback was submitted; checks remained in the signed-in session.
- 2026-11-18: In the signed-in `tcm` session, in-app Home, Topics, Posts, and Threads populated after a 10-second wait. Search and Galleries showed empty states without route-specific console or HTTP errors; enabled-feed settings were not checked. No direct-entry, refresh, or anonymous acceptance is claimed.
- 2026-11-18: Owner clarified the intentional root/feed redirect and identified `forum.tcmdev.ca` as a personal-blog example deployment, not onboarding. Authorized read-only checks began; short-wait empty states remain inconclusive. No production settings or content were changed.
- 2026-11-18: `yarn.cmd test --file navigation.browser.test.ts` passed 4/4 tests (12/12 including setup). This is local test-app evidence only; demo route and hydration validation remain open.
- 2026-11-17: Ticket created from recorded marketing-review observations. No browser, application, or deployment checks were run.
