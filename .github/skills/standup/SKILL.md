---
name: standup
description: "Audit ClassicForum ticket files and summarize active work, backlog, and priorities."
argument-hint: "Optional --focus, --ticket NNNN, --priority, --limit, or --repository-root"
---

# Standup

## Workflow

1. Read `docs/tickets/_template.md`. Audit tickets in `docs/tickets/`, `backlog/`, and `completed/`; exclude the template.
2. Group root tickets by state (`Planned`, `In Progress`, `Paused`, `Blocked`). Use the Backlog lane for `Deferred` tickets in `backlog/` and the Completed lane for `Completed` tickets in `completed/`. Flag folder/state mismatches.
3. Flag unparseable tickets, duplicate IDs, and filename/heading ID mismatches. Check `State`, `Priority`, `Next`, section order, and newest-first progress. Extra sections belong between `Notes` and `Relevant Files`.
4. Completed tickets need `Next: None`, checked `Requirements` and `Tasks` (including sub-tasks), and no `Dependencies` section.
5. Flag unknown IDs, self-dependencies, cycles, and links that are broken or point to the wrong ID. Flag completed prerequisites and empty `Dependencies` sections for removal, not as blockers. Flag direct ticket links in `Notes`.
6. Read requirements, tasks, dependency states and reasons, and latest progress before recommending work. Edit tickets only when asked; follow the template without copying its comments or placeholders.

## Commands

Run `yarn standup` from the repository root (`yarn.cmd standup` if PowerShell blocks the shim). The audit is read-only.

```sh
yarn standup --focus backlog --priority Low --limit 10
yarn standup --ticket 0083
yarn standup --focus cleanup
yarn standup --focus dependencies
```

`--focus` accepts `active`, `backlog`, `priority`, `cleanup`, or `dependencies`. Use `--ticket NNNN` for status, dependencies, checklists, and latest progress. Use `--priority High|Medium|Low` and `--limit` to narrow work lists, or `--repository-root` to select another checkout. The Node script resolves its default checkout from its own location.

## Report

- Report only the requested focus or ticket. By default, show lane and priority counts, in-progress/paused/blocked work, next candidates, and cleanup.
- Give priority and `Next` for current work. Say what blocks completion without assuming all work is blocked.
- Recommend unblocked planned root tickets before backlog work: High first, then Medium. Include Low when requested.
- Use the conversation date and workspace-relative links. Counts come from ticket files.