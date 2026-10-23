---
name: browser-validation
description: "Use when: performing browser validation, manual UI smoke testing, visual QA, or checking app behavior after a change. Covers shared browser control, route-based checks, safe test data, and reporting environment failures."
argument-hint: "Optional scope, such as a commit range, route, feature, or changed files"
---

# Browser Validation

Use this workflow to validate user-visible behavior in the running ClassicForum app with the shared VS Code browser. Keep the pass proportional to the change: cover each affected user journey, not every route in the application.

## 1. Establish Scope

1. If given a baseline commit, inspect `git diff --name-status <base>..HEAD` and `git log --oneline <base>..HEAD`.
2. Group changes into user-facing routes, API-backed flows, and non-browser concerns such as migrations, deployment scripts, or database transactions.
3. Read the relevant ticket or acceptance criteria when available. Do not treat a browser pass as proof of server-side atomicity, authorization, migration safety, or test coverage.

## 2. Inspect the Browser

1. Reuse the shared page when available; do not open a duplicate tab unnecessarily.
2. Start with a page snapshot to identify the current route, account state, controls, and visible errors.
3. Prefer accessible element references from the snapshot for clicks. Use screenshots to inspect visual layout; use snapshots to identify elements and their state.
4. Navigate directly to affected routes when that is clearer than following unrelated UI paths. Re-read the page after navigation or interaction.
5. If a framework-driven target is not actionable through its snapshot reference, use a stable selector with the Playwright `page` API, then verify the URL and reread the snapshot.
6. Use Playwright only when the browser's page, navigation, click, or dialog tools cannot perform the needed check.
7. Check `/api/health` before interpreting widespread `503` responses. If app or database status is not ready, treat feature checks as blocked until startup completes.

## 3. Exercise Flows Safely

1. Check route load, primary content, relevant controls, and expected empty, error, or success states.
2. Prefer read-only actions first. Before mutations, use disposable development data and confirm cleanup is possible; do not submit, delete, publish, revoke sessions, or change account settings unless the user authorized state changes.
3. For confirmations, verify the prompt and dismiss it when the destructive action is outside scope.
4. Record route, action, expected result, observed result, and relevant browser console or request errors.
5. Distinguish application regressions from environment/data problems such as unavailable API dependencies, missing local media, or stale seeded records. If legacy metadata points to files lost during a restore or reformat, classify those failures separately from a known-good asset uploaded during the pass. Recheck after navigation before attributing old console events to a route.

## Troubleshooting

1. For API-backed failures, open the developer error view and inspect the newest entry's timestamp, stack, method, and request path. Compare timestamps after each retry; the error list retains older failures.
2. For runtime type errors, trace the value from the failing route through the database/shared boundary. Do not assume a JSON-looking ID is a string at runtime; inspect the SDK value and preserve the app's declared contract at the boundary. Prefer a focused browser reproduction over a broad database rewrite.
3. For media issues, use a known-good repository asset for a fresh upload. Verify the returned CDN URL loads and inspect the image's `complete`, `naturalWidth`, and `naturalHeight`; compare its bare ID with the stored filename when needed. Legacy 404s alone do not establish an upload regression.
4. Clean up test mutations through the normal UI when possible. For a private image, verify the owner delete/refund result and that scheduled cleanup removes its file. For a test reply, open its detail page, delete it through its options menu, and confirm it disappears. Do not overwrite or discard existing drafts or user data to make a test pass.

## 4. Report Coverage

1. List the changed journeys that were exercised and the outcomes.
2. Separate failures from blocked or untested flows; explain what dependency or safety limit prevented validation.
3. Call out non-browser behavior that still needs focused tests, database checks, or operational validation.
4. Do not claim a full pass when infrastructure failures or untested requirements prevent it.
