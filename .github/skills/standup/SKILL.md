---
name: standup
description: "Use when: preparing an OpenForum standup, regular software status meeting summary, ticket kanban board, ticket dashboard, backlog summary, active work snapshot, priority overview, or docs/tickets status report. Scans docs/tickets, backlog, and completed tickets and returns concise helpful project-status information."
argument-hint: "Optional focus, such as active only, backlog only, high priority, or cleanup notes"
---

# Standup

Use this skill to summarize the current OpenForum ticket state from `docs/tickets/` as a compact standup-style kanban status report.

## Workflow

1. Inspect the ticket folders:
   - `docs/tickets/*.md`
   - `docs/tickets/backlog/*.md`
   - `docs/tickets/completed/*.md`
2. Read `docs/tickets/_template.md` for the current conventions, then exclude it from ticket counts.
3. For each ticket, collect:
   - ticket number and title from `# Ticket NNNN: Title`
   - folder location: root, `backlog`, or `completed`
   - `State`, `Priority`, and `Next` from the `## Status` block
   - ticket numbers and reasons from `## Dependencies`, when present; resolve each prerequisite's state across all ticket folders
   - acceptance criteria from `## Requirements`, actionable steps from `## Tasks`, and the newest dated `## Progress Log` entry; logs use reverse chronological order
4. Classify lanes primarily by state, with folder location as supporting context:
   - `In Progress`: `State: In Progress`
   - `Planned`: root tickets with `State: Planned`
   - `Backlog`: tickets in `docs/tickets/backlog/` with `State: Planned`
   - `Completed`: tickets with `State: Completed`
5. Call out mismatches instead of silently fixing them, especially:
   - tickets in `completed/` whose `State` is not `Completed`
   - root or backlog tickets whose `State` is `Completed`
   - missing `Priority`, `State`, or `Next` values; completed tickets use `Next: None`
   - any ticket that does not follow the template's state values, fields, or section order, or whose progress log is not newest first
   - unknown prerequisite numbers, self-dependencies, or dependency cycles
6. If the user gives an argument, tailor the report to that focus while still including enough context to be useful.
7. Do not modify ticket files unless the user explicitly asks for cleanup or reorganization. Before each ticket edit, read the current `docs/tickets/_template.md`. Follow its conventions without copying guidance comments or placeholder instructions into the ticket.

## Recommended Output

Keep the response concise and useful for planning. Prefer these sections:

1. `Overview`: counts by lane and a one-line read on what the lane means.
2. `In Progress`: ticket links, priority, and `Next` step.
3. `Next Work`: active `Planned` tickets with `Priority: High`; if none, use medium-priority active tickets.
4. `Priorities`: counts of high, medium, and low priority tickets by active/root, backlog, and completed folders.
5. `Cleanup`: state/folder mismatches or missing metadata.

## Conventions

- Use the current date from the conversation context when saying when the snapshot was generated.
- Link ticket files with workspace-relative markdown links.
- Keep ticket titles human-readable; do not repeat long paths when a table is clearer.
- Treat `docs/tickets/` root as the active work pool, not necessarily all work currently in progress.
- Omitted `Dependencies` sections mean there are no recorded prerequisites. A ticket with unfinished prerequisites may have work available, but cannot be completed yet; call those out and prefer unblocked tickets for next-up recommendations.
- When recommending next work, prefer active/root high-priority tickets before backlog tickets.
- Mention that counts are based on the ticket docs, not an external issue tracker.