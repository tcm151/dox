# Ticket 0036: Generate Image Thumbnails On Upload

## Status
- State: Deferred
- Priority: Medium
- Next: Resume implementation with the agreed 480px WebP thumbnail policy.

## Goal
Generate a small thumbnail derivative for uploaded images so post previews can load a lighter asset when a post includes images. Keep this ticket limited to post previews; other image surfaces continue using the full-size asset.

## Requirements
- [ ] Image uploads create both the display image and a 480px-bounded WebP thumbnail using the existing Sharp-based processing flow; GIF thumbnails use the first frame while the original remains animated.
- [ ] Image records expose a thumbnail URL or equivalent field without breaking existing consumers of `url`.
- [ ] Post previews render the thumbnail asset with a full-size fallback; other image surfaces continue to use the full-size URL.
- [ ] Deleting or rolling back an image also removes any generated thumbnail file and does not leave orphaned media.

## Tasks
- [ ] Extend server media processing to produce the agreed thumbnail buffer for image uploads.
- [ ] Persist thumbnail files under a predictable CDN path and update image schema, types, and the 2026.6.3 migration to expose the thumbnail URL.
- [ ] Update image upload creation to save the thumbnail after the image record is created and roll back cleanly on write failures.
- [ ] Switch `PostPreview` and its post-image projections to use the thumbnail URL with a full-size fallback.
- [ ] Add focused coverage for upload, thumbnail serving, post preview data, and delete cleanup.

## Notes
- Current image processing already uses Sharp in `server/utils/media.ts`, so thumbnail generation should likely live near the existing image handlers.
- The current image schema computes only `url`; a new computed `thumbnailUrl` or stored derivative metadata will be needed.
- The thumbnail policy is a WebP derivative bounded to 480px on each side; animated GIF uploads retain their original animation and use the first frame for the thumbnail.
- Only post previews consume thumbnails in this ticket. Gallery, thread, image-feed, detail, and editor/slideshow surfaces remain on the full-size URL.
- The schema field belongs in the current 2026.6.3 migration.

## Relevant Files
- server/utils/media.ts
- server/api/image/upload.ts
- server/api/image/[id]/delete.ts
- server/api/post/index.ts
- server/utils/feedPagination.ts
- server/assets/schema.surql
- server/assets/migrations/
- shared/types/index.ts
- app/components/system/previews/PostPreview.vue

## Progress Log
- 2026-11-16: Narrowed thumbnail use to post previews and paused implementation by request.
- 2026-07-21: Ticket created.
