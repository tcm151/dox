---
name: programming
description: "Use for programming work in this repository: implementing features, fixing bugs, refactoring, debugging, reviewing code, validating SurrealDB schema and migrations, or designing API workflow routes and manager methods. Favor small changes, clear contracts, direct paths, and practical refactoring."
argument-hint: "Optional focus: feature, bug, refactor, debugging, or review"
---

# Programming Principles

The goal is code that is easy to use and easy to follow. You should be able to trace what happens without hunting through layers. Better developer experience is worth a refactor when the improvement is real.

## Work In Small Chunks

1. Start with the behavior that needs to change. Find the code that owns it, its callers, and the nearest useful test. Read `docs/Architecture.md` and related tickets when the change crosses project boundaries.
2. Say what you think is happening and find the smallest check that could prove you wrong.
3. Make one coherent change. Run the closest useful test, typecheck, or lint check before moving on.
4. Keep the change focused. Refactor when it makes the interface, call path, or next change easier. Do not refactor just to make code look different.
5. Recheck files whenever live contents differ from the version you inspected. Treat small, coherent differences as likely developer or formatter edits: preserve them and adapt your patch to the current source; never undo them to recover stale context. If the content appears corrupted or structurally damaged, pause edits and notify the user rather than attempting an unverified repair.

## Make The Contract Clear

- Give each module one clear job and a simple interface. Make its inputs, outputs, errors, and important side effects easy to see.
- Keep the path from caller to behavior direct. Do not add layers or helpers just to move code somewhere else. Add them when they name repeated work, contain real complexity, or make the interface easier to use.
- There is no one right programming style for every problem. Use functions, objects, or both. Functions work well for focused operations; objects make sense when state, identity, or lifecycle belong together.
- Use names that are descriptive but short. Avoid abbreviations that make the reader guess.
- Prefer established domain types for view-layer data. Reuse an existing type when a UI-only condition can be identified by a stable field; do not add a one-off interface or union just to describe an isolated sentinel or satisfy a local type check.
- Add dedicated interfaces and types for meaningful, reusable domain or API contracts. Inline genuinely simple one-off shapes instead of promoting them into types with no broader value.

## Keep Code Where Its Job Belongs

- Put UI and route composition in `app/`, HTTP behavior in `server/api/`, backend services in `server/utils/`, and shared contracts and helpers in `shared/`.
- Keep each class in a same-named file within its existing domain directory and use a named export so Nuxt auto-imports can resolve it. Move class-owned stateless helpers into private static members, but keep shared helpers separate.
- Use `DatabaseQuery` for database access. Bind Surreal record IDs with `addRecord` or `addRecords`; use `addParameter` for ordinary values.
- When one `DatabaseQuery.addSql()` block contains multiple SurrealQL statements, always add `.addTransaction()` before execution so the block runs atomically and is handled as one query. A SQL block being formatted across multiple lines is not itself the criterion; count statements. In particular, do not put an authorization `IF` before a result `SELECT` in an unwrapped block: `queryAll()` reads the first statement's rows and will not skip ahead to the `SELECT` result. Use separate queries when the operations should not be atomic.
- Treat `shared/types/` and `server/assets/schema.surql` as one data contract. When stored data changes, update the types and schema together, and add a versioned migration when existing databases need it. Before creating a migration, inspect the current in-progress migration: consolidate related schema/data changes into it when the user confirms that version is still the target. If the change is materially different, ask whether to include it or create a new migration. Do not rewrite a released migration by default; use a forward migration unless the user explicitly requests consolidation and confirms replay is appropriate.
- Sometimes when retiring a stored field in a `SCHEMAFULL` table, `REMOVE FIELD` removes its schema definition but leaves existing record values. `UPDATE ... UNSET field` cannot clear a required field while its strict type is still active. Redefine it as `option<T>`, migrate any values, unset it, then remove its definition; verify this sequence in a disposable SurrealDB sandbox.
- Follow the Nuxt conventions and nearby code. Reuse a pattern when it makes the code clearer; do not introduce another way to do the same thing without a good reason.

## Map Routes To Workflows

- When user-facing operations have distinct behavior or side effects, give each operation a named API route and a matching domain-manager method. For reports, `report/[id]/resolve` maps to `ReportManager.resolve`, `reopen` to `ReportManager.reopen`, and `remove` to `ReportManager.remove`; topic-scoped routes use the same action names.
- Keep route handlers focused on HTTP concerns: authenticate, enforce broad role requirements, parse the request, collect route IDs, and call the matching manager method. Keep the workflow's database transaction and its state-dependent side effects together in that method.
- Use route guards such as `requireRole` for role-based authorization; do not repeat role checks in SQL. Put additional data-scoped checks in the transaction when they depend on database state. For topic reports, moderator routes pass topic scope and SQL verifies the moderator assignment and report membership. An authorized admin can use the global scope without a topic assignment check.
- Avoid one generic `update` endpoint that accepts a status/action to select among materially different workflows. Avoid a generic manager `updateStatus`/`persistDecision` method or generated SQL fragments when those workflows have different validation, transitions, or notifications. Prefer named methods with explicit, self-contained SQL blocks, even if some authorization or SQL is repeated.
- Keep this mapping tied to external workflows, not every manager method. `SettingsManager.update` is called by a settings route; `UserManager.create` is called by registration orchestration; `NotificationManager.send` is a cross-cutting side effect called by domain handlers and does not need its own route.
- Follow the existing domain boundary for manager placement. Report workflows live in `server/utils/ReportManager.ts`; reusable session, user, and notification managers live under `server/utils/repos/`. Do not move a manager solely to make every class follow one location or route shape.

## Check That It Works

- Test what the code does, not only whether the request returned successfully. Include useful success and failure cases, and check the resulting state when a status code is not enough.
- Keep test data isolated and predictable or unique. Clean up what a test creates unless another test step needs it.
- When the repository provides a full test command, run it as the primary integration check. Do not replace it with a hand-built or selectively filtered harness just to reach later tests; let the standard runner expose its first failure, then use a focused follow-up only to diagnose or validate that failure.
- Before creating an ad hoc test runner, check whether the repository's test command already covers the behavior. Do not duplicate its bootstrap or sequencing unless the standard runner cannot express the needed check; if a focused runner is necessary, state why.
- Start with the smallest useful check for an edit, then run the repository's broader test command when the change's risk or reach calls for it.
- For disposable SurrealDB schema, migration, or query probes, use `node scripts/surreal-explore.mjs -` with inline code on stdin. The runner supplies a fresh embedded database plus `db` and `assert`, then closes and removes the sandbox. Do not recreate the connection and temporary-database bootstrap in ad hoc scripts or run probes against the app database.

## Changelog Timing

- Do not add changelog entries while a patch is still in progress.
- After the patch is complete and verified, prepare the changelog when choosing the next application version. Review commits and tracked changes since the latest release tag, plus intended untracked files, and summarize the finished patch set.
- Update `package.json` and `CHANGELOG.md` together as part of release preparation; do not maintain a rolling unreleased section during implementation.