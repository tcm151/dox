# Ticket 0081: Inline Edit Markdown Preview

## Status
- State: Deferred
- Priority: Low
- Next: Confirm the preview toggle behavior for inline post and thread edits

## Goal
Let authors inspect rendered Markdown while editing an existing post or thread on its detail page, without saving their changes first.

## Requirements
- [ ] Inline post and thread editing can switch between the editable source and a rendered preview of the current unsaved content.
- [ ] Switching modes does not save, discard, or otherwise mutate the content being edited.
- [ ] Existing save and cancel behavior remains intact, and preview controls are keyboard accessible.

## Tasks
- [ ] Reuse the existing Markdown renderer in the post and thread detail edit flows.
- [ ] Restore or replace the commented preview state and controls on both detail pages.
- [ ] Verify preview updates, save/cancel behavior, and keyboard access for both content types.

## Notes
- Build on the isolated edit buffers from Ticket 0114 so toggling and cancelling do not mutate displayed persisted content.
- This covers inline editing on detail pages, not the editor routes whose preview behavior is tracked in completed Ticket 0011.
- Side-by-side preview in the post/thread editor routes is tracked separately in Ticket 0091.

## Relevant Files
- app/pages/post/[id].vue
- app/pages/thread/[id].vue
- app/components/text/Markdown.vue

## Progress Log
- 2026-11-17: Added the unsaved-edit isolation prerequisite; inline preview remains planned.
- 2026-11-09: Ticket created.