---
name: programming
description: "Use for programming work in this repository: implementing features, fixing bugs, refactoring, debugging, reviewing code, or validating SurrealDB schema and migrations. Favor small changes, clear contracts, direct paths, and practical refactoring."
argument-hint: "Optional focus: feature, bug, refactor, debugging, or review"
---

# Programming Principles

The goal is code that is easy to use and easy to follow. You should be able to trace what happens without hunting through layers. Better developer experience is worth a refactor when the improvement is real.

## Work In Small Chunks

1. Start with the behavior that needs to change. Find the code that owns it, its callers, and the nearest useful test. Read `docs/Architecture.md` and related tickets when the change crosses project boundaries.
2. Say what you think is happening and find the smallest check that could prove you wrong.
3. Make one coherent change. Run the closest useful test, typecheck, or lint check before moving on.
4. Keep the change focused. Refactor when it makes the interface, call path, or next change easier. Do not refactor just to make code look different.

## Make The Contract Clear

- Give each module one clear job and a simple interface. Make its inputs, outputs, errors, and important side effects easy to see.
- Keep the path from caller to behavior direct. Do not add layers or helpers just to move code somewhere else. Add them when they name repeated work, contain real complexity, or make the interface easier to use.
- There is no one right programming style for every problem. Use functions, objects, or both. Functions work well for focused operations; objects make sense when state, identity, or lifecycle belong together.
- Use names that are descriptive but short. Avoid abbreviations that make the reader guess.

## Keep Code Where Its Job Belongs

- Put UI and route composition in `app/`, HTTP behavior in `server/api/`, backend services in `server/utils/`, and shared contracts and helpers in `shared/`.
- Use `DatabaseQuery` for database access. Bind Surreal record IDs with `addRecord` or `addRecords`; use `addParameter` for ordinary values.
- Treat `shared/types/` and `server/assets/schema.surql` as one data contract. When stored data changes, update the types and schema together, and add a versioned migration when existing databases need it. Before creating a migration, inspect the current in-progress migration: consolidate related schema/data changes into it when the user confirms that version is still the target. If the change is materially different, ask whether to include it or create a new migration. Do not rewrite a released migration by default; use a forward migration unless the user explicitly requests consolidation and confirms replay is appropriate.
- Follow the Nuxt conventions and nearby code. Reuse a pattern when it makes the code clearer; do not introduce another way to do the same thing without a good reason.

## Check That It Works

- Test what the code does, not only whether the request returned successfully. Include useful success and failure cases, and check the resulting state when a status code is not enough.
- Keep test data isolated and predictable or unique. Clean up what a test creates unless another test step needs it.
- When the repository provides a full test command, run it as the primary integration check. Do not replace it with a hand-built or selectively filtered harness just to reach later tests; let the standard runner expose its first failure, then use a focused follow-up only to diagnose or validate that failure.
- Before creating an ad hoc test runner, check whether the repository's test command already covers the behavior. Do not duplicate its bootstrap or sequencing unless the standard runner cannot express the needed check; if a focused runner is necessary, state why.
- Start with the smallest useful check for an edit, then run the repository's broader test command when the change's risk or reach calls for it.
- For disposable SurrealDB schema, migration, or query probes, use `node scripts/surreal-explore.mjs -` with inline code on stdin. The runner supplies a fresh embedded database plus `db` and `assert`, then closes and removes the sandbox. Do not recreate the connection and temporary-database bootstrap in ad hoc scripts or run probes against the app database.