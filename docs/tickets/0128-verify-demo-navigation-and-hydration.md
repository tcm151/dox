# Ticket 0128: Verify Demo Navigation And Hydration

## Status
- State: Blocked
- Priority: High
- Next: Reproduce the recorded redirects on an authorized demo or equivalent isolated deployment and capture the deployed version/settings.

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
- The 2026-11-17 demo review recorded About/Search/Topics/Threads redirecting to the feed and a hydration warning. This ticket does not establish that the same symptoms still occur or share one cause.
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
- 2026-11-17: Ticket created from recorded marketing-review observations. No browser, application, or deployment checks were run.
