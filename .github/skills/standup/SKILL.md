---
name: standup
description: "Use for an ClassicForum standup or a summary of ticket status, active work, backlog, priorities, or completed tickets. Scans docs/tickets and returns a concise status report."
argument-hint: "Optional --focus, --ticket NNNN, --priority, --limit, or --repository-root"
---

# Standup

Use this to summarize ticket status from `docs/tickets/` as a concise standup report.

## Workflow

1. Read ticket files from:
   - `docs/tickets/*.md`
   - `docs/tickets/backlog/*.md`
   - `docs/tickets/completed/*.md`
2. Read `docs/tickets/_template.md` for current conventions. Do not count the template as a ticket.
3. For each ticket, record:
   - number and title from `# Ticket NNNN: Title`
   - folder: root, `backlog`, or `completed`
   - `State`, `Priority`, and `Next` from `## Status`
   - dependencies and reasons, when present; look up each dependency's state
   - requirements and task checklists, including nested sub-tasks, and the newest dated progress entry
   - for completed tickets, confirm every Requirements and Tasks checkbox is checked
4. Assign lanes by state, using the folder to distinguish planned work from backlog:
   - `In Progress`: `State: In Progress`
   - `Paused`: `State: Paused`
   - `Blocked`: `State: Blocked`
   - `Planned`: root ticket with `State: Planned`
   - `Backlog`: ticket in `docs/tickets/backlog/` with `State: Planned`
   - `Completed`: `State: Completed`
5. Flag mismatches; do not fix them silently. Check for:
   - tickets in `completed/` not marked `Completed`
   - root or backlog tickets marked `Completed`
   - missing `State`, `Priority`, or `Next`; completed tickets use `Next: None`
   - fields, states, or section order that differ from the template; ticket-specific sections are allowed after `Notes` and before `Relevant Files`; progress logs not newest first
   - unknown dependencies, self-dependencies, or cycles
   - duplicate ticket IDs, filename/heading ID mismatches, and Markdown files that cannot be parsed as tickets
   - dependency links whose target is missing or does not match the linked ticket ID
   - completed tickets with unchecked Requirements or Tasks
6. Use the user's requested focus, but keep enough context to make the report useful.
7. Do not edit ticket files unless the user asks for cleanup or reorganization. Before editing a ticket, read `docs/tickets/_template.md` and follow it without copying its comments or placeholders.

## Commands

Run the read-only audit from the repository root with Yarn and Node.js:

```sh
yarn standup
```

If PowerShell blocks the `yarn.ps1` shim, run `yarn standup` instead.

The Node script locates the repository from its own path, so it can also be run directly from another directory. Use `--focus active`, `backlog`, `priority`, `cleanup`, or `dependencies` to limit the report to those sections. Use `--ticket 0083` for one ticket's status, dependencies, checklists, and latest progress. `--priority High|Medium|Low` filters work lists; without it, next-work candidates prefer High, then Medium, and `--priority Low` includes low-priority options. `--limit 10` shows more entries. For example:

```sh
yarn standup --focus backlog --priority Low --limit 10
yarn standup --ticket 0083
yarn standup --focus cleanup
yarn standup --focus dependencies
```

Use `yarn standup --repository-root "C:\path\to\repo"` to select a checkout explicitly. The report includes parse/ID/section/checklist/folder/link issues, unfinished dependencies, and dependency cycles. It is read-only. Treat it as an inventory aid: read ticket requirements, tasks, dependency reasons, and progress entries before recommending work.

## Recommended Output

When using `--focus` or `--ticket`, omit unrelated sections and report only the requested slice; the default remains the full standup.

Keep the report concise and useful for planning. Use these sections:

1. `Overview`: counts by lane and a short description of each lane.
2. `In Progress`: links, priority, and `Next` step.
3. `Paused`: links, priority, and the step needed to resume.
4. `Blocked`: links, priority, and the blocking dependency or issue.
5. `Next Work`: high-priority planned tickets in root; if none, use medium-priority planned tickets in root.
6. `Priorities`: high, medium, and low counts by active/root, paused, blocked, backlog, and completed.
7. `Cleanup`: state/folder mismatches and missing metadata.

## Conventions

- Use the current conversation date for the snapshot date.
- Link tickets with workspace-relative paths.
- Keep titles readable; avoid repeating long paths when a table is clearer.
- Treat root tickets as the active work pool, not proof that every ticket is in progress.
- Use `Paused` for work deliberately put on hold; preserve a concrete `Next` action for resumption.
- A missing `Dependencies` section means no prerequisites are recorded. Flag unfinished prerequisites; the ticket may have work available but cannot be completed yet. Prefer unblocked tickets when recommending next work.
- Recommend high-priority active/root work before backlog items.
- Say that counts come from ticket files, not an external tracker.