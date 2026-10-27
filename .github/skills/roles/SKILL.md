---
name: roles
description: "Use when explaining ClassicForum account roles, role-gated pages or actions, or troubleshooting access to application features. Check current UI routes and server authorization; inspect recent developer errors when diagnosing failures."
---

# ClassicForum Roles

Use this skill to explain which application areas and actions are available to an account, and to troubleshoot role-gated behavior from the current implementation.

## Role Model

The role union is defined in `shared/types/index.ts`; membership checks are in `shared/utils/roles.ts`. Roles are additive, and a user may have more than one:

- `moderator`: moderator topics and requests, plus reports for topics where the user is assigned as a moderator.
- `admin`: global administration, including users, reports, pins, settings, and enabled feedback tools. Admins can also access topic moderation flows.
- `developer`: developer information, schema, database query, and error-log tools. Some content-management APIs also allow developers; verify each route rather than assuming developer implies admin.

An authenticated account without one of these roles can use ordinary member features but cannot access the corresponding privileged surfaces. Check the user’s actual `roles` array; do not infer permissions from the account name or visible navigation alone.

## Workflow

1. Identify the requested page or action and the account’s assigned roles.
2. Check the current page and tab definitions in `app/pages/admin.vue`, `app/pages/moderator.vue`, and `app/pages/developer.vue` to describe the visible application surfaces.
3. Trace the relevant API handler and its `authenticateRequest`, `requireRole`, and resource-specific checks. Client page middleware and hidden buttons are not authorization boundaries.
4. For topic moderation, verify both the moderator role and assignment to the requested topic. Admin access may be global where the handler explicitly allows it.
5. Explain the specific allowed or denied action, its route, and any resource-scope restriction. Distinguish a missing role from a missing topic assignment or unavailable feature setting.

## Troubleshooting

When a user reports that an application action fails, check the newest relevant entry in **Developer > Errors** (`/developer/errors`) before proposing a code or data change:

1. Refresh the list and match the latest entry by timestamp, HTTP status, method, and request path.
2. Expand it and inspect the error description, stack, and request details. Older entries can describe an earlier attempt, so compare timestamps after retries.
3. Check `/api/health` if errors suggest startup or database readiness problems.
4. For a database or migration error, inspect the current schema and recorded migration version through developer tools using read-only queries first. Do not replay migrations or run mutating queries without explicit authorization.
5. If no matching error exists, inspect the UI event path, API response, and server-side authorization separately. Report what was observed and what remains unverified.

Treat error logs and database query tools as privileged diagnostics. Do not expose credentials or unrelated personal data in explanations.