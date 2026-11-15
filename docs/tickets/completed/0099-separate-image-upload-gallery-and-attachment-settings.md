# Ticket 0099: Separate Image Upload, Gallery, and Attachment Settings

## Status
- State: Completed
- Priority: Medium
- Next: None

## Dependencies
- [0100](0100-strict-appsettings-schema.md): Establish the strict AppSettings schema before adding image-policy fields.

## Goal
Give admins independent control over image uploads, gallery publishing, and attaching images to supported submission types without conflating those policies with gallery feed visibility.

## Requirements
- [x] Admin settings independently control image uploads, gallery publishing, and image attachments to posts and threads; replies follow the post setting.
- [x] Editor controls reflect each setting, and server APIs enforce it for direct requests as well as normal UI workflows.
- [x] Existing galleries and image attachments remain viewable when a related publishing or attachment setting is disabled.
- [x] AppSettings types, defaults, validation, schema, and migration stay consistent for fresh and existing installations.
- [x] Tests cover enabled and disabled behavior at the relevant API boundaries.

## Tasks
- [x] Define setting names, defaults, and interactions, keeping gallery feed visibility separate from gallery publication.
- [x] Update the shared settings contract, defaults, admin controls, server validation, schema, and migration.
- [x] Update editor affordances and enforce upload, gallery-publish, and post/thread-attachment settings in server workflows.
- [x] Add focused settings and API tests for each policy.

## Notes
- `media.images.enabled` gates uploads and gallery publishing. `media.gallery.enabled` independently controls gallery publishing when uploads are enabled.
- `media.images.attachments.posts` and `.threads` are combined with image-upload enablement in `SettingsManager`; replies follow the post setting.
- `feeds.images` controls gallery visibility independently from publication. The admin feed control is nested under the gallery-publishing control without changing its stored value.
- Posts and threads store image attachments and their editors use the shared image uploader. Replies are posts. Comments currently have no image attachment field and are outside this ticket's initial scope.
- Disabling a creation setting does not remove existing galleries or attachments.
- Policy fields extend the strict AppSettings schema established by Ticket 0100 in migration `2026.6.3`.

## Relevant Files
- shared/types/index.ts
- app/utils/settings.ts
- app/pages/admin/settings.vue
- server/utils/SettingsManager.ts
- server/assets/schema.surql
- server/assets/migrations/
- app/pages/editor.vue
- app/pages/editor/image.vue
- app/pages/editor/post.vue
- app/pages/editor/thread.vue
- server/utils/media.ts
- server/api/image/upload.ts
- server/api/gallery/publish.ts
- server/api/post/add.ts
- server/api/thread/add.ts
- tests/parallel/settings.server.test.ts
- tests/sequential/10-media-settings.server.test.ts

## Progress Log
- 2026-11-15: Completed independent upload, gallery-publishing, and attachment policies, including server enforcement and existing-content visibility coverage. `yarn typecheck` and `yarn test --sequential` passed (19/19); browser runs exposed low-spec timeouts in unrelated account/editor specs.
- 2026-11-15: Started implementation after Ticket 0100 completed; preserve current behavior with true defaults for the new policies.
- 2026-11-13: Ticket created.