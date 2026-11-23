# Ticket 0089: Define Account Privacy Controls

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Define the first account-level privacy controls and their defaults before implementation, without conflating them with content tagging and visibility preferences.

## Requirements
- [x] The initial privacy control set, audience behavior, and defaults are documented.
- [x] The affected profile, content, and API surfaces are identified, including authorization expectations.
- [x] Data-contract and migration implications are documented without introducing unapproved behavior.
- [x] Follow-up implementation work is captured in focused tickets linked from the roadmap.

## Tasks
- [x] Inventory account and profile information currently exposed to signed-in and public viewers.
- [x] Propose privacy controls and defaults with explicit user-visible behavior.
- [x] Document affected UI, APIs, contracts, and migration requirements.
- [x] Create implementation tickets after the control set is agreed.

## Notes
- This is a scoping ticket; it does not change current visibility behavior.
- Content tags and user/community visibility modes are already covered by completed Ticket 0016.
- Public profile APIs expose profile metadata (name, link, description, join date), activity/reputation metrics, followed topics, and follower/following lists. Public user feeds expose active authored content; the public profile page also displays these fields and metrics.
- The authenticated account endpoint returns the current user's email while omitting the password. Profile and preference APIs require authentication; user profile, listing, feed, follower/following, and topic endpoints are public.
- No account privacy controls currently exist in `UserSettings`; adding persisted controls would affect the shared type, schema, and a forward migration.
- Agreed control: one profile-level audience setting with `public`, `members`, and `private` values. Public is visible to anyone, members to authenticated users, and private to the profile owner; existing and new users default to public.
- The setting gates link and description fields, follower/following relationships and followed topics (including their list/count surfaces), and the profile-feed aggregation. It does not hide usernames or author attribution, alter individual authored-content visibility, hide join/activity/reputation metrics, or change account-email access.
- The API directory and profile/detail/social/feed endpoints must apply the selected audience consistently without leaking controlled data. The profile UI must explain restricted data while individual authored content remains governed by existing content-visibility rules.
- Implementation is tracked in Ticket 0107.

## Relevant Files
- docs/Architecture.md
- docs/API.md
- app/pages/settings/preferences.vue
- app/pages/user/[id]/index.vue
- app/pages/user/[id]/followers.vue
- app/pages/user/[id]/following.vue
- app/pages/user/[id]/topics.vue
- app/components/system/previews/UserPreview.vue
- server/api/user/
- server/api/profile/settings/
- server/utils/repos/UserSettingsManager.ts
- server/assets/schema.surql
- server/assets/migrations/
- shared/types/index.ts

## Progress Log
- 2026-11-16: Added profile-feed aggregation to the agreed privacy scope: restricted audiences cannot view the profile's aggregate feed, while individual public content remains accessible. Documented public/member/private audiences and public defaults, and created implementation Ticket 0107 without changing visibility behavior.
- 2026-11-16: Started the scope audit and inventoried public profile, activity, relationship, content, and private account data surfaces. Awaiting agreement on the first control set and audience defaults.
- 2026-11-12: Ticket created.