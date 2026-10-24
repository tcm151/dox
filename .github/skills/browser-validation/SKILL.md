---
name: browser-validation
description: "Use for browser validation, UI smoke testing, visual QA, or checking app behavior after a change. Covers shared browser use, safe test data, and blocked-check reporting."
argument-hint: "Optional scope: route, feature, changed files, or commit range"
---

# Browser Validation

Use this to check user-visible behavior in the running ClassicForum app with the shared VS Code browser. Match the check to the change: cover affected journeys, not every route.

## 1. Establish Scope

1. If given a baseline commit, inspect `git diff --name-status <base>..HEAD` and `git log --oneline <base>..HEAD`.
2. Separate browser-visible routes and API flows from work a browser cannot verify, such as migrations, deployment scripts, or database transactions.
3. Read the relevant ticket or acceptance criteria. Browser checks do not prove server-side atomicity, authorization, migration safety, or test coverage.

## 2. Inspect the Browser

1. Reuse the shared page when available; do not open a duplicate tab without a reason.
2. Take a snapshot first. Note the route, account state, controls, and visible errors.
3. Use accessible snapshot references for clicks. Use screenshots for layout and snapshots for elements and their state.
4. Go straight to affected routes when that is clearer than navigating unrelated UI. Re-read the page after navigation or interaction.
5. If a framework-driven target cannot be activated from the snapshot, use a stable selector with the Playwright `page` API. Then verify the URL and reread the snapshot.
6. Use Playwright only when the browser's page, navigation, click, or dialog tools cannot do the check.
7. Check `/api/health` before interpreting widespread `503` responses. If the app or database is not ready, stop feature checks until startup completes.

## 3. Exercise Flows Safely

1. Check route load, main content, controls, and expected empty, error, or success states.
2. Start with read-only actions. Before a mutation, use disposable development data and confirm cleanup is possible. Do not submit, delete, publish, revoke sessions, or change account settings without user authorization.
3. For confirmations, verify the prompt. Dismiss it if the destructive action is outside scope.
4. Record the route, action, expected and observed results, and relevant browser console or request errors.
5. Separate application regressions from environment or data problems, such as unavailable APIs, missing media, or stale records. For legacy metadata that points to files lost during a restore or reformat, compare against a known-good asset uploaded during this pass. Recheck after navigation before attributing old console events to a route.

## Troubleshooting

1. For API failures, inspect the newest developer error entry: timestamp, stack, method, and request path. Compare timestamps after retries; older errors remain in the list.
2. For runtime type errors, trace the value from the route through the database/shared boundary. Do not assume a JSON-looking ID is a string; inspect the SDK value and preserve the declared contract. Prefer a focused browser reproduction over a broad database rewrite.
3. For media issues, upload a known-good repository asset. Verify the CDN URL loads and inspect the image's `complete`, `naturalWidth`, and `naturalHeight`; compare its bare ID with the stored filename if needed. A legacy 404 alone does not prove an upload regression.
4. Clean up test mutations through the UI when possible. For a private image, verify the owner's delete/refund result and that scheduled cleanup removes its file. For a test reply, open its detail page, delete it through its options menu, and confirm it disappears. Do not overwrite or discard existing drafts or user data to make a test pass.

## 4. Report Coverage

1. List the journeys checked and their outcomes.
2. Separate failures from blocked or untested flows. Say which dependency or safety limit prevented a check.
3. Call out non-browser behavior that still needs focused tests, database checks, or operational validation.
4. Do not claim a full pass when infrastructure failed or requirements remain untested.
