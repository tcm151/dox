# Ticket 0091: Side-by-Side Markdown Preview

## Status
- State: Deferred
- Priority: Medium
- Next: Define preview layout and debounce behavior for post and thread editors

## Goal
Let authors edit Markdown and inspect its rendered output side by side in the post and thread editor routes.

## Requirements
- [ ] Post and thread editors show source and rendered preview together at supported viewport sizes.
- [ ] Preview updates are debounced and reflect the current unsaved source.
- [ ] Previewing does not save or mutate the draft content, and editor state is preserved when switching layouts.
- [ ] Preview controls and layout remain keyboard-accessible and usable on narrow screens.

## Tasks
- [ ] Define responsive layout and debounce behavior for the editor routes.
- [ ] Reuse the existing Markdown renderer for unsaved editor content.
- [ ] Add the side-by-side preview to post and thread editors.
- [ ] Cover preview updates, state preservation, accessibility, and narrow layouts.

## Notes
- This is editor-route preview work; inline detail-page editing is tracked separately in Ticket 0081.
- Existing thread editor preview behavior is documented in completed Ticket 0011.

## Relevant Files
- app/pages/editor/post.vue
- app/pages/editor/thread.vue
- app/components/text/Markdown.vue

## Progress Log
- 2026-11-12: Ticket created.