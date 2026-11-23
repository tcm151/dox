# Ticket 0124: Align Complex Routes With Domain Workflows

## Status
- State: Planned
- Priority: Medium
- Next: Trace comment creation, its transaction, and notification handling into one named domain workflow.

## Goal
Bring complex older write handlers into the named route-to-manager pattern used by reports and shared target actions. Keep HTTP parsing separate from cohesive publication policy, persistence, and side-effect orchestration.

## Requirements
- [ ] Comment creation and the bounded post/thread/draft publication flows have clear domain-owned entry points where they contain meaningful workflow logic.
- [ ] Routes retain HTTP authentication, broad role guards, input parsing, and route-ID collection; domain methods receive typed values rather than H3 events.
- [ ] State-dependent checks and writes remain together with their required transaction boundaries and DatabaseQuery result contracts.
- [ ] Lock, slow-mode, topic, attachment, ownership, block, and notification behavior is preserved for each workflow.
- [ ] Equivalent work is shared only when authorization, transitions, and side effects truly match; distinct operations do not become a generic action/status dispatcher.
- [ ] Existing API paths, response shapes, defaults, and error semantics remain unchanged and retain focused regression coverage.

## Tasks
- [ ] Inventory the responsibilities and callers of comment creation before choosing its domain method boundary.
- [ ] Move the cohesive comment workflow, including notification orchestration, behind its named entry point.
- [ ] Apply the same boundary to complex post/thread/draft publication logic in small, coherent follow-ups within this ticket.
- [ ] Reuse existing managers for their existing responsibilities and remove newly redundant route-owned orchestration.
- [ ] Preserve transactional and best-effort side-effect behavior with focused API tests and update the architectural map where needed.

## Notes
- Report resolution routes already delegate to ReportManager, and completed Ticket 0106 centralizes equivalent award, visit, archive, and pin work.
- Comment creation still contains moderation SQL, creation, and notification orchestration directly in its handler. Post/thread creation similarly owns publication and attachment transactions.
- Do not add a pass-through manager for every trivial read or move classes merely to make directories look uniform.
- Do not collapse materially different post, thread, draft, or comment policies into a universal content-update framework.
- Tickets 0119 and 0121 improve adjacent contracts; coordinate overlapping files without inventing a dependency where a behavior-preserving move can proceed independently.

## Relevant Files
- server/api/comment/add.ts
- server/api/post/add.ts
- server/api/thread/add.ts
- server/api/profile/drafts/add.ts
- server/api/report/[id]/resolve.ts
- server/utils/ReportManager.ts
- server/utils/ContentManager.ts
- server/utils/repos/NotificationManager.ts
- docs/Architecture.md
- tests/parallel/posts.server.test.ts
- tests/parallel/threads.server.test.ts

## Progress Log
- 2026-11-17: Ticket created from the developer consistency review. No route implementation or runtime behavior was changed.
