# Ticket 0011: Thread Editor Parity With Post Editor

## Status
- State: Todo
- Priority: Medium
- Next action: Identify parity gaps and phase into 2 implementation passes

## Goal
Bring thread editor capabilities in line with post editor for consistency and reduced maintenance overhead.

## Done Looks Like
- [ ] Thread editor supports matching core draft workflow.
- [ ] Preview behavior matches post editor expectations.
- [ ] Upload and mention workflows are consistent with existing editor patterns.

## Tasks
- [ ] Document current gap list between thread and post editor.
- [ ] Implement highest-impact parity features first (draft + preview).
- [ ] Add/adjust shared editor logic to reduce duplication.

## Notes

## Relevant Files
- [app/pages/editor/thread.vue](../../app/pages/editor/thread.vue)
- [app/pages/editor/post.vue](../../app/pages/editor/post.vue)
- [app/components/system/MediaUploader.vue](../../app/components/system/MediaUploader.vue)
- [app/components/form/fields/TopicField.vue](../../app/components/form/fields/TopicField.vue)

## Progress Log
- 2026-04-13: Ticket created.


