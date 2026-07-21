# Ticket 0034: Fullscreen Editor Viewport Bounds

## Status
- State: Todo
- Priority: Medium
- Next action: Audit post and thread editor layout heights

## Goal
Make writing and previewing posts and threads feel stable by giving editor surfaces a fullscreen workflow with viewport-bounded text areas and preview panes.

## Done Looks Like
- [ ] Post and thread editors can use the available viewport height for the writing and preview experience without pushing key actions off-screen.
- [ ] Markdown textareas cannot be resized taller than the fullscreen editor area; overflowing content scrolls inside the textarea instead of expanding the page.
- [ ] Switching between edit and preview keeps the user near the same writing or reading position without requiring extra page scrolling.

## Tasks
- [ ] Audit editor page layout, toolbar, footer, and preview containers for fixed-height/fullscreen behavior.
- [ ] Update `MarkdownEditor` styling or props so editor textareas can fill their container while respecting viewport max-height constraints.
- [ ] Align edit and preview pane heights so toggling preview does not shift the page or hide the toggle controls.
- [ ] Preserve or restore textarea and preview scroll positions when toggling between edit and preview.
- [ ] Test desktop and mobile viewport sizes with long post and thread content.

## Notes
- Current issue: long textareas can become taller than the screen, so toggling between editing and previewing forces a lot of page scrolling and makes it hard to keep the same place in the text.
- Prefer a shared solution in the editor component/layout instead of one-off height rules on each page.

## Relevant Files
- [app/components/form/MarkdownEditor.vue](../../app/components/form/MarkdownEditor.vue)
- [app/pages/editor/post.vue](../../app/pages/editor/post.vue)
- [app/pages/editor/thread.vue](../../app/pages/editor/thread.vue)
- [app/layouts/simple.vue](../../app/layouts/simple.vue)

## Progress Log
- 2026-07-21: Ticket created.