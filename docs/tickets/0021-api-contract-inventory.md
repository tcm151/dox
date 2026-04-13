# Ticket 0021: API Contract Inventory

## Status
- State: Todo
- Priority: Medium
- Next action: Generate initial endpoint list by scanning server/api routes

## Goal
Create a practical API inventory documenting auth requirements and response shapes for safer iteration.

## Done Looks Like
- [ ] Core API endpoints are cataloged with method/path/auth expectations.
- [ ] High-risk write endpoints are marked.
- [ ] Inventory is easy to update as routes evolve.

## Tasks
- [ ] Enumerate routes under server/api and group by feature area.
- [ ] Document auth/role requirements per endpoint.
- [ ] Add response/validation notes for major endpoints.

## Notes

## Relevant Files
- [server/api/[...].ts](../../server/api/[...].ts)
- [docs/Architecture.md](../Architecture.md)
- [docs/ContributionGuide.md](../ContributionGuide.md)
- [shared/types/index.ts](../../shared/types/index.ts)

## Progress Log
- 2026-04-13: Ticket created.


