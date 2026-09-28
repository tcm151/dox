# Ticket 0041: Link Detail and Feed Integration

## Status
- State: Todo
- Priority: Medium
- Next action: Map the fields needed by a link detail page and compact feed preview onto the Ticket 0039 contract.

## Goal
Make published links readable, discoverable, and actionable through a canonical detail page and the same feed surfaces used by other content types.

## Done Looks Like
- [ ] Each published link has a canonical detail page with author, topics, content, destination, and moderation actions.
- [ ] Link previews render correctly through `MultiPreview` without changing post, thread, or image rendering.
- [ ] Public links can appear in applicable topic and aggregate feeds with stable sorting and pagination behavior.
- [ ] Owners and authorized moderators can perform the documented link lifecycle actions.
- [ ] Disabled link feeds do not expose link entries through feed APIs or navigation.

## Tasks
- [ ] Build the link detail page with safe external-link behavior and metadata fallback states.
- [ ] Add a compact reusable link preview and register it with `MultiPreview`.
- [ ] Include links in the applicable feed queries and feed navigation settings.
- [ ] Add owner deletion and generic report and vote actions consistent with other content types.
- [ ] Define whether published link fields are editable and implement or explicitly defer that lifecycle.
- [ ] Validate detail loading, missing records, permissions, disabled settings, and mixed-feed rendering.

## Notes
- Depends on Ticket 0039. Ticket 0040 enriches previews but is not required for basic detail and feed rendering.
- Reuse the generic vote and report endpoints where their record-level authorization and schema assumptions hold.

## Relevant Files
- app/components/system/previews/MultiPreview.vue
- app/pages/feed.vue
- server/api/feed/popular.ts
- server/api/report/send.ts
- server/api/vote/[id]/positive.ts
- shared/types/index.ts

## Progress Log
<!-- Add newest progress entries first; keep this log in reverse chronological order. -->
- 2026-09-28: Ticket created.