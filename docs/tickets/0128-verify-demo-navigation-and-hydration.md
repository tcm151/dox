# Ticket 0128: Verify Demo Navigation And Hydration

## Status
- State: In Progress
- Priority: High
- Next: After release approval and a fresh backup, deploy the expanded path-only diagnostic build and compare Node's original URL and matched route records for `/about` and `/feed/threads`.

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
- 2026-11-19: Read-only production checks through the shared signed-in `tcm` browser reproduced direct `/about` and `/feed/threads` redirects to `/feed`, settling at `/feed/home`; both responses were 302. Direct `/contact` returned 200. A direct origin GET of `/about` on port 8001 also returned 302, and its request ID matched the app log (`requestPath: "/about"`, `resolvedPath: "/"`). Browser request IDs for `/about` and `/feed/threads` likewise matched root-redirect log entries. This confirms the root route middleware is reached before the redirect; it does not yet explain why Nuxt resolves those requests as `/`. The `/feed/home` page logged a hydration mismatch after the redirect, with no causal link established. No production configuration or content was changed.
- 2026-11-19: Production runs package `2026.6.4` from `/root/forum/2026.6.4` under Node `22.14.0`. The active Nginx vhost proxies `/` to `127.0.0.1:8001/` without a rewrite, and direct origin requests reproduce the redirect. Its default combined access log records URI and status but not request ID, upstream status/address, or `Location`; it forwards `Host`, `X-Real-IP`, and `X-NginX-Proxy`, but not `X-Forwarded-Proto`. The isolated WSL build from the matching source commit `fa682faa` returned 200 for `/about` and `/feed/home` directly and through its proxy under Node `24.18.0`; its H3, Node, SSR initial, and resolved paths agreed. The Node version differs from production and was not changed during this investigation.
- 2026-11-19: The unreleased SSR diagnostic now records query-free `requestPath`, H3 URL path, Node request path, Node original URL path, Nuxt initial path, router base, resolved path, and matched route-record paths. These additions should distinguish URL mutation from route matching without logging cookies, query values, or arbitrary headers. Optional Nginx correlation fields for a future access-log format are `$sent_http_x_request_id`, `$request_uri`, `$uri`, `$upstream_addr`, `$upstream_status`, and `$sent_http_location`; that would be a separate config/reload, and direct-origin reproduction means it is not required to establish that the current failure is app-side. No production build or configuration was changed.
- 2026-11-19: Follow-up read-only checks confirmed `forum.service` still runs `/root/forum/2026.6.4` with Node 22.14.0. At 15:31-15:33 UTC, direct-origin `/about` request `3fa93478-a1af-431f-bad8-a7b18c719bb0`, browser `/about` request `7b7a5841-e558-41b2-abcd-b48cba008e0b`, and browser `/feed/threads` request `0997f81f-184f-4e5a-b2ac-fda25c9a9333` each correlated with a root-redirect log entry; Nginx recorded 302 for the browser navigations. `/contact` returned 200 at 15:32:53 UTC. The journal also contains repeated mismatches for direct `/feed/home` and `/post/...` requests. The vhost has a `proxy_redirect` rule for absolute `http://127.0.0.1:8001/` Location values; the observed app response uses relative `Location: /feed`, so this response-header rule does not explain the route resolving as `/`. No production configuration, release, or service state was changed; the SSH session was closed.
- 2026-11-17: Ticket created from recorded marketing-review observations. No browser, application, or deployment checks were run.
