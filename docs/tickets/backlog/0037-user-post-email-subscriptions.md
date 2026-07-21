# Ticket 0037: User Post Email Subscriptions

## Status
- State: Todo
- Priority: Medium
- Next action: Draft the subscription preference data model and matching rules for subscribed users and post topics.

## Goal
Let users subscribe to another user and receive email when that user publishes matching posts. Subscriptions should be configurable so a subscriber can choose all posts from a user or only posts that include selected topics.

## Done Looks Like
- [ ] Users can create, edit, disable, and remove email subscriptions for a specific user.
- [ ] Each subscription supports at least two scopes: all posts by the user, or posts by the user that match selected topics.
- [ ] Email delivery triggers when a subscribed user publishes a matching post and respects account email state plus global notification/email preferences.
- [ ] Delivery avoids self-notifications, duplicate emails, and notifications for archived or failed post creations.

## Tasks
- [ ] Define the persisted subscription model, including subscriber, target user, delivery scope, selected topics, enabled state, and timestamps.
- [ ] Add API endpoints for listing and mutating user post email subscriptions.
- [ ] Add user-facing controls on profile/following or settings surfaces to manage subscriptions.
- [ ] Hook post creation into subscription matching and email delivery through the existing email utility.
- [ ] Add focused tests for matching rules, opt-out behavior, and duplicate-prevention cases.
- [ ] Document how this feature interacts with global notification preferences.

## Notes
- Coordinate with Ticket 0008 so this feature consumes the global notification/email preference model instead of introducing conflicting toggles.
- Existing follow mechanics should inform the UX, but subscribing to email updates may need to remain distinct from following a user or topic.
- Initial scope assumes regular posts only; include threads or media later only if product requirements expand.
- If selected topics are empty in topic-filtered mode, the UI/API should reject the subscription or treat it as disabled rather than silently emailing all posts.

## Relevant Files
- docs/tickets/0008-user-notification-preferences.md
- app/utils/following.ts
- app/pages/user/[id]/index.vue
- app/pages/settings/preferences.vue
- server/api/post/add.ts
- server/api/user/[id]/follow.ts
- server/api/topic/[topic]/follow.ts
- server/utils/email.ts
- shared/types/index.ts

## Progress Log
- 2026-07-21: Ticket created.