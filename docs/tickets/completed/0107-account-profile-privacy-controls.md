# Ticket 0107: Implement Account Profile Privacy Controls

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Let users control who can see their profile details and social information. Keep authored-content visibility governed by the existing content visibility controls.

## Requirements
- [x] Users can select a profile audience of public, members, or private; existing and new accounts default to public.
- [x] Profile details, social information, and profile-feed aggregation are enforced consistently across the directory, profile, feed, and relationship APIs and UI.
- [x] Unauthorized viewers cannot retrieve controlled profile fields, social lists/counts, or the profile feed; the profile owner can always view them.
- [x] Public usernames and author attribution, authored content, email access, and activity/reputation metrics retain their existing behavior.
- [x] Hiding a profile feed does not prevent individual public content from being viewed through its existing routes.
- [x] The setting is persisted, validated, documented, migrated, and covered by focused server and browser tests.

## Tasks
- [x] Add and validate `UserSettings.privacy.profile` with a public default in types, schema, settings UI, and a forward migration.
- [x] Enforce audience checks in the public user directory, profile detail, profile-feed, follower, following, and followed-topic APIs.
- [x] Update profile, feed, and relationship pages to communicate restricted profile data without changing individual authored-content visibility.
- [x] Add focused migration, authorization, privacy-leak, and browser coverage; update the API documentation.

## Notes
- Scope and audience behavior are agreed in Ticket 0089.
- Audience values: `public` permits any viewer, `members` requires authentication, and `private` permits only the profile owner.
- The setting covers link, description, followers/following relationships and counts, followed topics, and the aggregated feed on the user's profile. Hiding the profile feed does not hide or restrict direct access to the user's individual public content.
- Usernames and attribution, date joined, visits, votes, and score remain unaffected.
- Keep account email owner-only as it is today; do not fold account credentials or content visibility settings into this control.

## Relevant Files
- app/pages/settings/preferences.vue
- app/pages/user/[id]/index.vue
- app/pages/user/[id]/followers.vue
- app/pages/user/[id]/following.vue
- app/pages/user/[id]/topics.vue
- app/components/system/previews/UserPreview.vue
- server/api/user/
- server/api/user/[id]/feed.ts
- server/api/profile/settings/
- server/utils/repos/UserSettingsManager.ts
- server/assets/schema.surql
- server/assets/migrations/
- shared/types/index.ts
- docs/API.md

## Progress Log
- 2026-11-17: Completed; passed `yarn.cmd test --server`, both focused privacy tests, and `yarn.cmd typecheck`.
- 2026-11-16: Added the profile-feed aggregation to the agreed privacy behavior; individual content remains publicly accessible under existing rules.
- 2026-11-16: Ticket created from the agreed Ticket 0089 privacy scope.
