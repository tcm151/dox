# Ticket 0011: Thread Editor Parity With Post Editor

## Status
- State: In Progress
- Priority: Medium
- Next action: Implement pass 1: auth/content validation, editor redirect cleanup, and image upload plumbing

## Goal
Bring thread editor capabilities in line with post editor for consistency and reduced maintenance overhead.

## Done Looks Like
- [ ] Thread editor supports matching core draft workflow.
- [ ] Preview behavior matches post editor expectations.
- [ ] Upload and mention workflows are consistent with existing editor patterns.

## Tasks
- [x] Document current gap list between thread and post editor.
- [ ] Implement highest-impact parity features first (draft + preview).
- [ ] Add/adjust shared editor logic to reduce duplication.

## Notes
- 2026-07-21 review found that some thread editor parity work has already landed:
	- `app/pages/editor/thread.vue` uses `MarkdownEditor` for content.
	- Thread editor has a preview toggle and markdown preview rendering.
	- Thread editor already uses `TopicField`, so topic validation/restriction is mostly shared through that component.
- The original ticket wording is still directionally correct, but the remaining work is narrower than "add preview/editor basics".

### Current parity gaps
- Draft workflow is still the largest missing area.
	- Thread editor has a Drafts button, but it is currently a no-op.
	- Post editor supports server-backed draft load/save/update and Ctrl+S save.
	- Existing `draft` records are post-shaped: they require `title`, allow `replyTo` only for posts, and do not carry a `kind`/`type` field.
	- Revisit decision: either generalize the draft schema/API for post/thread drafts, or intentionally implement a smaller client-only thread draft flow.
- Upload workflow is still incomplete for threads.
	- Thread editor upload button currently only shows a warning.
	- Backend `thread` records and `/api/thread/add` already accept `images`, so the missing piece is mostly front-end upload state and submit payload wiring.
	- Verify/fix `MediaUploader` first: it declares an `upload` event, and post editor listens for it, but the visible Upload button should be checked to ensure it actually emits.
- Thread image display may need a companion pass.
	- Post previews show attached image thumbnails.
	- Thread preview/detail rendering mainly shows markdown content and quote content; attached `thread.images` are not obviously rendered.
	- If thread uploads are added, ensure attached images are visible somewhere outside markdown links.
- Auth and validation parity need cleanup.
	- Post editor has route middleware that aborts unauthenticated `/editor` access.
	- Thread editor currently lacks the matching page guard and assumes `session.user.id` during submit.
	- Thread content has a schema assertion of 4-512 chars; add client-side validation before submit so failures are clear.
- Editor shell redirect likely has a small bug.
	- `app/pages/editor.vue` uses `default: "posts"`, but the route is `/editor/post`.
	- Clean this up while touching editor parity.
- Mention workflow remains future shared editor work.
	- No completed post-side mention picker was found during the 2026-07-21 review.
	- `TopicField` has a TODO to extract a shared searchable dropdown for topic and mention pickers.
	- Treat mentions as a shared component follow-up unless a separate mention implementation appears first.

### Suggested implementation passes
- Pass 1: Low-risk parity and correctness.
	- Fix `/editor` default tab from `posts` to `post`.
	- Add thread editor auth guard matching post editor behavior.
	- Add thread content validation before submit.
	- Fix/verify `MediaUploader` emits upload from its Upload button.
	- Add thread image upload state using the post editor pattern.
	- Send uploaded image ids in `/api/thread/add` payload.
	- Render attached thread images in thread previews/detail where appropriate.
- Pass 2: Draft model decision and shared extraction.
	- Decide whether `draft` becomes polymorphic (`kind: post | thread`) or whether thread drafts remain local/client-only.
	- If server-backed, migrate schema/API/types and update `Drafts.client.vue` to handle title-less thread drafts.
	- Add thread draft save/update/load and Ctrl+S support.
	- Extract shared editor helpers/components after post and thread behavior is aligned enough to avoid premature abstraction.

### Watch-outs
- Avoid copying the post draft model directly into thread drafts without addressing required `title` and post-only `replyTo` semantics.
- Upload parity should include both creation-time attachment and display-time rendering.
- Keep thread content length aligned with the schema limit unless the product decision is to change that limit.

## Relevant Files
- [app/pages/editor/thread.vue](../../app/pages/editor/thread.vue)
- [app/pages/editor/post.vue](../../app/pages/editor/post.vue)
- [app/components/system/MediaUploader.vue](../../app/components/system/MediaUploader.vue)
- [app/components/form/fields/TopicField.vue](../../app/components/form/fields/TopicField.vue)
- [app/pages/editor.vue](../../app/pages/editor.vue)
- [app/components/system/previews/ThreadPreview.vue](../../app/components/system/previews/ThreadPreview.vue)
- [server/api/thread/add.ts](../../server/api/thread/add.ts)
- [server/assets/schema.surql](../../server/assets/schema.surql)

## Progress Log
- 2026-07-21: Reviewed current editor implementation. Documented remaining gaps: draft workflow, thread uploads/image display, auth/content validation, editor default route cleanup, and future mention/shared dropdown work.
- 2026-04-13: Ticket created.


