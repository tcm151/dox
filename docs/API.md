# API Inventory

Inventory of feature handlers under `server/api/`. Every feature handler has a route entry; the generic catch-all fallback is documented separately. Paths use `:name` for dynamic segments; `{a,b}` abbreviates distinct endpoints only when their method and access rules match. Methods show the intended client verb, not every verb a generic handler may accept. Detailed contracts link to source and tests for selected workflows.

## Navigation

| Domain | Coverage |
| --- | --- |
| [Identity and Sessions](#identity-and-sessions) | Health, registration, login, profile settings, sessions, and notifications |
| [Notifications and Inbox](#notifications-and-inbox) | Notification listing and viewed-state actions |
| [Discovery and Feeds](#discovery-and-feeds) | Global, topic, and user feeds; topic and user profiles |
| [Content and Discussions](#content-and-discussions) | Post/thread reads and lifecycle, comments, and replies |
| [Media](#media) | Image/audio upload and gallery/image lifecycle |
| [Moderation](#moderation) | Report queues and decisions, topic-scoped actions, and conversation controls |
| [Engagement](#engagement) | Vote state and user relationships |
| [Administration and Curation](#administration-and-curation) | Privileged roles, application pins, and content curation |
| [Platform Settings](#platform-settings) | Public settings reads and privileged application-settings updates |
| [Developer Operations](#developer-operations) | Database maintenance and diagnostics |
| [Feedback and Support](#feedback-and-support) | Feedback submission and review |
| [Route Fallback](#route-fallback) | Handling for unmatched API paths |

## Identity and Sessions

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | [`/api/health`](#health) | Public; no authentication | Reports application readiness and database health. |
| `POST` | `/api/user/register` | Public | Creates an account and initial session. |
| `POST` | [`/api/profile/login`](#login) | Public; credentials required | Authenticates credentials and creates an access session. |
| `POST` | `/api/profile` | Authenticated | Returns the current user's authenticated profile. |
| `GET` | `/api/profile/authenticate` | Authenticated | Resolves the current access token to the signed-in user. |
| `POST` | `/api/profile/logout` | Authenticated | Invalidates the supplied session when `clear` is requested. |
| `GET` | `/api/profile/account` | Authenticated | Returns the current account details. |
| `POST` | `/api/profile/update` | Authenticated | Updates the current user's name, link, and description. |
| `POST` | `/api/profile/username-taken` | Authenticated | Checks whether a username is already in use. |
| `GET` | `/api/profile/settings` | Authenticated | Returns the current user's settings. |
| `PUT` | `/api/profile/settings/update` | Authenticated | Replaces the current user's settings. |
| `POST` | [`/api/profile/password/reset`](#password-reset) | Public | Requests a password reset email without disclosing whether the account exists. |
| `POST` | [`/api/profile/password/confirm`](#password-reset) | Public; reset token required | Sets a new password and invalidates the account's existing sessions. |
| `POST` | `/api/profile/confirm/send` | Authenticated; email required | Sends an account confirmation link. |
| `POST` | `/api/profile/confirm` | Public; confirmation token required | Confirms the account email. |
| `POST` | `/api/profile/sessions/invalidate` | Authenticated | Invalidates other sessions while preserving the current session. |
| `POST` | [`/api/profile/account/{delete,wipe}`](#account-deletion) | Authenticated; password and username confirmation | Deletes the account, retaining or removing eligible authored content. |

### Health

- Request: none.
- `200`: readiness report. The app and database report `ready`.
- `503`: app startup is incomplete or failed, or the database readiness query failed. The response uses the same report shape; `failureReason` may contain a redacted diagnostic.
- Response fields: `app`, `database`, `version`, `failureReason`, `timeStarted`, `lastChecked`, and `uptime`.
- Side effects: none; when the app is ready, the handler runs a lightweight database readiness query.
- Source: [handler](../server/api/health.ts), [health report](../server/utils/health.ts).
- Tests: [health API tests](../tests/sequential/00-health.server.test.ts), [migration readiness tests](../tests/sequential/03.migrations.server.test.ts).

### Login

- Method: the client uses `POST` through `useApi`; the current authentication test sends `GET`, which the generic handler also accepts. Align the test and handler with the intended `POST` contract.
- Access: no existing session is required; credentials are supplied in the `Authorization` header.
- Request: `Authorization` contains base64-encoded `username:password`; no body.
- `200`: `{ user, tokens: { access } }`.
- `401`: credentials cannot be authenticated.
- Side effects: creates a session and associates the account with the request.
- Source: [route](../server/api/profile/login.ts), [authentication](../server/utils/auth.ts).
- Tests: [account and authentication tests](../tests/parallel/account.server.test.ts).

### Password Reset

#### Request Reset Link

- Method: `POST /api/profile/password/reset`.
- Access: public; no existing session is required.
- Request body: `{ id }`, where `id` is the account username or email address.
- `200`: `{ message }` with the same generic text whether or not an account matches.
- Side effects: for a matching account, creates a reset token and attempts to email a link. Errors are swallowed and the response is delayed to at least one second to reduce account enumeration.

#### Set New Password

- Method: `POST /api/profile/password/confirm`.
- Access: public; requires the reset token ID, the account email, and a valid new password in `{ id, email, password }`.
- Success: completes without a response body.
- `400`: invalid email/password, email mismatch, expired token, or reused token. The handler normalizes transaction failures to `400`.
- Side effects: transactionally updates the password hash, marks the token used, and invalidates the account's existing sessions. Reset tokens expire after 15 minutes.
- Source: [reset request](../server/api/profile/password/reset.ts), [confirmation](../server/api/profile/password/confirm.ts), [token schema](../server/assets/schema.surql).
- Tests: no dedicated password-reset API test is currently present.

### Account Deletion

- Methods: `POST /api/profile/account/delete` retains published content; `POST /api/profile/account/wipe` removes or redacts eligible authored content.
- Access: authenticated user.
- Request body: `{ password, confirmation }`, where `confirmation` must exactly match the username.
- `204`: account removal completed; no response body.
- `400`: username confirmation mismatch. `403`: incorrect current password. `404`: account does not exist.
- Shared effects: removes the account, sessions, private settings, drafts, and account-linked private records. Retained authorship and moderation attribution are reassigned to `user:deleted`; historical votes are not rewritten.
- Delete behavior: retains published content and media under `user:deleted`.
- Wipe behavior: removes unreferenced submissions; content required by replies, quotes, or comments is redacted in place to preserve discussion references. Unused media is queued for cleanup.
- Source: [delete route](../server/api/profile/account/delete.ts), [wipe route](../server/api/profile/account/wipe.ts), [account manager](../server/utils/repos/AccountManager.ts).
- Tests: [account tests](../tests/parallel/account.server.test.ts) cover password rejection, retained content, and wipe behavior.

## Notifications and Inbox

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/profile/notifications?dismissed=&amount=` | Authenticated | Lists the caller's notifications; `dismissed=false` filters to unread and `amount` caps the returned list. |
| `POST` | `/api/profile/notifications/dismiss` | Authenticated | Marks the caller's unread notifications as viewed. |
| `POST` | `/api/profile/notifications/:id/dismiss` | Authenticated | Marks one of the caller's notifications as viewed. |

### Notification Inbox

- Access: authenticated user; list results are scoped to the current recipient.
- Request: `dismissed` is a boolean string; `false` returns unread notifications and `true` includes all. `amount` limits the returned array.
- `200`: `{ total, notifications }`; `total` is computed before the `amount` slice.
- Dismiss actions mark notifications as viewed; they do not delete them. The single-item action only updates a notification belonging to the caller.
- Source: [list handler](../server/api/profile/notifications/index.ts), [dismiss all](../server/api/profile/notifications/dismiss.ts), [dismiss one](../server/api/profile/notifications/[id]/dismiss.ts).
- Tests: notification delivery is exercised in workflow tests such as [thread tests](../tests/parallel/threads.server.test.ts); no dedicated inbox filtering/dismissal test was found.

## Discovery and Feeds

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | [`/api/feed/popular`](#feed-pagination) | Public | Returns a paginated aggregate feed. |
| `GET` | [`/api/feed/following`](#feed-pagination) | Authenticated | Returns a feed filtered by the current user's followed topics and users. |
| `GET` | `/api/feed/pinned` | Public | Returns active application-wide pinned content. |
| `GET` | [`/api/feed/search?text=`](#feed-search) | Public | Searches active posts, threads, galleries, and comments. |
| `GET` | `/api/trending/topics` | Public | Returns the five topics with the most recent post activity. |
| `GET` | `/api/trending/users` | Public | Returns the five highest-scoring users. |
| `GET` | `/api/settings/:id` | Public | Returns application settings for the requested ID. |
| `GET` | `/api/topic` | Public | Lists topics ordered by score. |
| `GET` | `/api/topic/available` | Public | Lists active topics available for selection. |
| `GET` | `/api/topic/:topic` | Public | Returns a topic profile and related gallery data. |
| `GET` | `/api/topic/:topic/feed?sortBy=` | Public | Returns active posts, top-level threads, and galleries for a topic. |
| `GET` | `/api/topic/:topic/followers` | Public | Lists users following a topic. |
| `GET` | `/api/topic/:topic/pins` | Public | Lists active pins for a topic. |
| `GET` | `/api/topic/:topic/related-topics` | Public | Lists topics related through shared content. |
| `GET` | `/api/topic/:topic/visit` | Public | Increments and returns the topic visit counter. |
| `GET` | `/api/user` | Public | Lists public user profile fields. |
| `GET` | `/api/user/:id` | Public | Returns a user's public profile. |
| `GET` | `/api/user/:id/feed?sortBy=` | Public | Returns active posts, top-level threads, and galleries by a user. |
| `GET` | `/api/user/:id/{followers,following,topics}` | Public | Lists a user's followers, followed users, or followed topics. |
| `GET` | `/api/user/:id/visit` | Public | Increments and returns the profile visit counter. |

### Feed Pagination

- Methods: `GET /api/feed/popular` and `GET /api/feed/following`.
- Access: popular feed is public; following feed requires authentication and includes content from followed topics or users.
- Query: `sortBy` accepts `new`, `hot`, or `top` and defaults to `new`. `pageSize` defaults to 20 and is clamped to 1-50; `offset` defaults to 0 and is clamped to a nonnegative maximum.
- `200`: `{ items, offset, more }`; `items` may contain active posts, links, top-level threads, or galleries, and `more` indicates whether another item exists.
- Source: [feed handlers](../server/api/feed/popular.ts), [following handler](../server/api/feed/following.ts), [pagination implementation](../server/utils/feedPagination.ts).
- Tests: [feed pagination tests](../tests/sequential/02-feeds.server.test.ts) cover sort modes, offsets, limits, and followed-topic filtering.

### Feed Search

- Method: `GET /api/feed/search?text=`.
- Access: public.
- Request: `text` is the search query. Missing or whitespace-only text returns `200 []`.
- `200`: matching active posts, threads, galleries, and comments, ordered by case-insensitive exact substring match, search score, recency, then record ID. Results with neither an exact match nor a score of at least `0.5` are omitted. Deleted comments and comments under inactive or deleted contexts are excluded.
- Source: [search handler](../server/api/feed/search.ts).
- Tests: [search API tests](../tests/parallel/search.server.test.ts) cover ranking and exclusion of inactive or deleted content.

## Content and Discussions

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/post` | Public | Lists active posts. |
| `GET` | `/api/post/:id` | Public | Returns a post and its discussion. |
| `GET` | `/api/post/:id/visit` | Public | Increments and returns the post visit counter. |
| `GET` | `/api/link/:id` | Public | Returns a link and its discussion. |
| `GET` | `/api/link/:id/visit` | Public | Increments and returns the link visit counter. |
| `POST` | `/api/link/:id/edit` | Authenticated; Link author | Updates the authored Link description. |
| `POST` | `/api/link/:id/delete` | Authenticated; author or admin | Deletes or redacts the Link while preserving its discussion. |
| `POST` | `/api/link/:id/award` | Authenticated; token balance; not owner or previous awarder | Transfers an award to the Link author. |
| `POST` | `/api/link/:id/{archive,pin}` | Admin | Archives/restores a Link or queues an application pin for review. |
| `POST` | [`/api/link/preview`](#link-preview) | Authenticated; bounded public URL fetch | Returns best-effort title, description, and image metadata for the editor. |
| `GET` | `/api/profile/drafts` | Authenticated | Lists the current user's drafts. |
| `POST` | `/api/profile/drafts/add` | Authenticated | Creates a draft for the current user. |
| `POST` | `/api/profile/drafts/:id/{update,delete}` | Authenticated; draft owner | Updates or deletes an owned draft. |
| `POST` | [`/api/post/add`](#create-post) | Authenticated; resource and image-attachment settings | Publishes a post for the current user. |
| `POST` | [`/api/link/add`](#create-link) | Authenticated; resource checks | Publishes a link for the current user. |
| `POST` | `/api/post/:id/edit` | Authenticated; post author | Edits the post content. |
| `POST` | `/api/post/:id/delete` | Authenticated; author or admin | Deletes or redacts the post while preserving referenced discussion. |
| `GET` | `/api/thread` | Public | Lists active top-level threads. |
| `GET` | `/api/thread/:id` | Public | Returns a thread and its reply context. |
| `GET` | `/api/thread/:id/visit` | Public | Increments and returns the thread visit counter. |
| `POST` | `/api/thread/add` | Authenticated; resource and image-attachment settings | Publishes a thread. |
| `POST` | `/api/thread/:id/edit` | Authenticated; thread author | Edits the thread content. |
| `POST` | `/api/thread/:id/delete` | Authenticated; author or admin | Deletes or redacts the thread according to its discussion links. |
| `POST` | `/api/thread/:id/quote` | Authenticated | Publishes a quote of a thread unless it is locked. |
| `POST` | `/api/comment/add` | Authenticated; discussion rules | Adds a comment or reply to a post, link, or gallery discussion. |
| `POST` | `/api/comment/:id/edit` | Authenticated; comment author | Edits the comment content. |
| `POST` | `/api/comment/:id/delete` | Authenticated; author or admin | Deletes or redacts the comment according to its replies. |
| `POST` | [`/api/thread/:id/reply`](#thread-reply) | Authenticated; discussion rules | Adds a reply subject to lock and slow-mode rules. |

### Create Post

- Access: authenticated user. Topic state, image ownership/publication, and the post/reply image-attachment setting are checked server-side.
- Request body: `title`, `content`, and `topics`; optional `tags`, `replyTo`, and `images`.
- `200`: created `Post` record.
- `401`: no valid session. `403`: image attachment is disabled or an attached image is unavailable or not permitted. `409`: a selected topic is locked.
- Side effects: creates the post and initializes the author's positive vote.
- Source: [route](../server/api/post/add.ts).
- Tests: [post API tests](../tests/parallel/posts.server.test.ts).

### Link Preview

- Access: authenticated user; targets are restricted to public HTTP and HTTPS addresses on default ports.
- Request body: `{ url }` (at most 2048 characters).
- `200`: `{ title?, description?, imageUrl? }`; descriptions are limited to 256 characters, and unavailable or non-HTML metadata returns an empty object.
- `400`: invalid URL or a target/redirect resolving to a private or reserved address. `401`: no valid session. `429`: more than 60 requests per minute from the same client address.
- Side effects: performs a remote HTML/JSON request and caches its result in memory for ten minutes. DNS lookups, idle socket timeouts, redirect count, and response size are limited; an absolute request deadline remains tracked in [Ticket 0040](tickets/completed/0040-safe-link-metadata-previews.md).
- Source: [route](../server/api/link/preview.ts), [preview manager](../server/utils/LinkPreviewManager.ts).
- Tests: [preview manager and endpoint tests](../tests/parallel/link-preview.server.test.ts).

### Thread Reply

- Access: authenticated user. The route checks that the parent thread exists and is not locked; slow mode may delay replies.
- Request body: `content`; optional `tags`.
- `200`: created `Thread` reply.
- `401`: no valid session. `404`: parent thread does not exist. `409`: replies are locked. `429`: slow mode is active.
- Side effects: creates a reply, initializes the author's positive vote, and sends an in-app notification to the parent author subject to notification preferences.
- Source: [route](../server/api/thread/[id]/reply.ts), [notification manager](../server/utils/repos/NotificationManager.ts).
- Tests: [thread API tests](../tests/parallel/threads.server.test.ts).

## Media

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | [`/api/image/upload`](#image-upload) | Confirmed account | Uploads an image and charges the applicable token cost. |
| `POST` | [`/api/gallery/publish`](#gallery-publication) | Confirmed account; gallery setting; image ownership | Publishes owned images as a gallery. |
| `GET` | `/api/gallery` | Public | Lists active galleries. |
| `GET` | `/api/gallery/:id` | Public | Returns gallery details and comments. |
| `GET` | `/api/gallery/:id/visit` | Public | Increments and returns the gallery visit counter. |
| `POST` | [`/api/gallery/:id/edit`](#gallery-edit) | Gallery owner | Updates the gallery description. |
| `POST` | [`/api/gallery/:id/award`](#gallery-award) | Authenticated; token balance; not owner or previous awarder | Transfers an award to the gallery author. |
| `POST` | `/api/gallery/:id/delete` | Gallery owner/admin | Deletes a gallery and cleans up unused topic records. |
| `GET` | `/api/image/:id` | Public | Returns image metadata and owner details. |
| `POST` | `/api/image/:id/delete` | Image owner/admin | Deletes an image unless it remains attached to content. |
| `GET` | `/api/audio` | Public | Lists published audio metadata. |
| `GET` | `/api/audio/:fileName` | Public | Returns audio metadata for a media filename. |
| `POST` | `/api/audio/upload` | Confirmed account; token balance | Uploads audio and charges the applicable token cost. |

### Image Upload

- Access: authenticated, confirmed user.
- Request: multipart form data containing a `file`.
- `200`: `{ media: Image, tokens: number }`.
- `400`: missing or invalid upload. `401`: no valid session. `403`: account is not confirmed or image uploads are disabled. `409`: insufficient tokens.
- Side effects: deducts tokens, creates image metadata, and writes the media file. Deletion/refund behavior is covered separately.
- Source: [route](../server/api/image/upload.ts), [media processing](../server/utils/media.ts).
- Tests: [media API tests](../tests/parallel/media.server.test.ts).

### Gallery Publication

- Method: `POST /api/gallery/publish`.
- Access: authenticated, confirmed user. Image uploads and gallery publishing must both be enabled. Every image must exist, be active, and be owned by the caller; topic cooldown and locked-topic checks also apply.
- Request body: `{ images, title, description, topics }`; `images` must be a nonempty array, `title` must be 4-128 characters, and `description` is limited to 256 characters. `tags` is optional.
- `200`: `true` after the gallery is created.
- `400`: no images supplied. `403`: image uploads or gallery publishing are disabled, or an image is unavailable or not owned by the caller. `404`: a referenced image does not exist. Locked-topic or cooldown errors are returned by the moderation checks.
- Side effects: creates the gallery transactionally and initializes the author's positive vote.
- Source: [publish handler](../server/api/gallery/publish.ts), [topic cooldown checks](../server/utils/ModerationManager.ts).
- Tests: [gallery API tests](../tests/parallel/galleries.server.test.ts) cover publication and ownership; [image policy tests](../tests/sequential/10-media-settings.server.test.ts) cover independent policy enforcement and existing-content visibility.

## Moderation

### Reports and Appeals

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | [`/api/report/send`](#submit-report) | Authenticated | Adds a report complaint to a content subject. |
| `GET` | `/api/report` | Admin | Lists reports in the global moderation queue. |
| `POST` | `/api/report/:id/appeal` | Authenticated; subject owner | Appeals a removed report subject. |
| `POST` | `/api/report/:id/{resolve,reopen,remove}` | Admin | Resolves, reopens, or removes a globally scoped report subject. |
| `POST` | `/api/report/:id/appeal/{accept,reject}` | Admin | Decides a global report appeal. |
| `GET` | `/api/profile/appeals/:id` | Authenticated; report owner | Returns the owner's view of a report appeal. |
| `GET` | [`/api/topic/:topic/reports`](#topic-report-queue) | Moderator/admin; topic-scoped | Lists reports visible in a topic moderation queue. |
| `POST` | `/api/topic/:topic/reports/:id/{resolve,reopen}` | Assigned moderator/admin | Resolves or reopens a report within a topic. |
| `POST` | `/api/topic/:topic/reports/:id/remove-topic` | Assigned moderator | Removes the report subject from one topic. |
| `POST` | `/api/topic/:topic/reports/:id/remove` | Admin | Removes a report subject through the topic route. |
| `POST` | `/api/topic/:topic/reports/:id/appeal/{accept,reject}` | Assigned moderator/admin | Decides an appeal in the topic moderation queue. |
| `GET` | `/api/moderator/reports` | Moderator | Lists visible reports across the current moderator's assigned topics. |
| `GET` | `/api/admin/logs/moderator` | Admin | Returns the latest 100 moderator log records. |

### Submit Report

- Access: authenticated user.
- Request body: `{ subject, reason }`; `reason` must remain nonempty after trimming.
- `204`: complaint accepted; no response body.
- `400`: missing or empty reason. `401`: no valid session. Other subject and rate-limit failures are surfaced as errors.
- Side effects: creates one report record per subject and appends subsequent complaints to that record.
- Source: [route](../server/api/report/send.ts), [report manager](../server/utils/ReportManager.ts).
- Tests: [report workflow tests](../tests/parallel/reports.server.test.ts).

### Topic Governance

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/topic/:topic/profile` | Assigned moderator/admin | Returns topic moderation settings. |
| `POST` | `/api/topic/:topic/update` | Assigned moderator/admin | Updates topic description, moderation settings, and rules. |
| `POST` | `/api/topic/:topic/request-moderation` | Confirmed account | Requests moderator access for a topic. |
| `POST` | `/api/topic/:topic/moderators/remove` | Admin | Removes a moderator from a topic. |
| `GET` | `/api/moderator/topics` | Moderator | Lists topics assigned to the current moderator. |
| `GET` | `/api/moderator/request` | Moderator | Lists pending moderator requests after reviewing approval thresholds. |
| `POST` | [`/api/moderator/request/:id/{approve,deny}`](#moderator-request-decisions) | Moderator/admin | Records an approval or denial toward the configured threshold. |
| `GET` | `/api/topic/:topic/pins/manage` | Assigned moderator/admin | Lists manageable pins for a topic. |
| `POST` | `/api/topic/:topic/pins/add` | Assigned moderator/admin | Pins active top-level posts, threads, galleries, or Links in a topic. |
| `POST` | `/api/topic/:topic/pins/:id/{update,delete}` | Assigned moderator/admin | Updates or removes a topic pin. |
| `POST` | `/api/topic/:topic/{lock,unlock}` | Admin | Locks or unlocks a topic. |

### Moderator Request Decisions

- Methods: `POST /api/moderator/request/:id/approve` and `POST /api/moderator/request/:id/deny`.
- Access: moderator or admin. Applicants cannot approve their own requests unless they are admins, and cannot deny their own requests. Closed requests and repeated same-kind decisions return `409`.
- Response: approval returns `{ approved, user, topic }`; denial records the vote.
- Side effects: once approvals reach the configured threshold and outnumber denials, the request closes, the applicant gains the moderator role and topic assignment, and receives a notification. Denials close the request when they reach the threshold and outnumber approvals. Reading the queue also reconciles requests against the current threshold.
- Source: [approval route](../server/api/moderator/request/[id]/approve.ts), [denial route](../server/api/moderator/request/[id]/deny.ts), [moderation manager](../server/utils/ModerationManager.ts).
- Tests: [moderation tests](../tests/parallel/moderation.server.test.ts) cover duplicate decisions, threshold promotion and closure, notifications, reconciliation, and audit records.

### Content Enforcement

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/moderation/:type/:id` | Moderator/admin | Returns the moderation state for a target. |
| `POST` | `/api/{post,gallery,image}/:id/report` | Authenticated | Reports a post, gallery, or image. |
| `POST` | `/api/{post,thread,gallery,link}/:id/tag/add` | Moderator/admin | Adds a moderation tag to content. |
| `POST` | `/api/moderation/:type/:id/{lock,slow}/{apply,clear}` | Moderator/admin; target-scope checks | Applies or clears a conversation lock or slow mode. |

### Topic Report Queue

- Access: authenticated moderator assigned to the topic, or admin. The query also applies subject visibility and moderator-recusal rules.
- Request: `topic` route parameter; no body.
- `200`: `Report[]` visible to the caller for that topic.
- `401`: no valid session. `403`: caller lacks the moderator/admin role or topic authorization.
- Side effects: none; this is a read-only moderation queue.
- Source: [route](../server/api/topic/[topic]/reports.ts).
- Tests: [report workflow tests](../tests/parallel/reports.server.test.ts).

## Engagement

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | [`/api/vote/:id/:kind`](#vote) | Authenticated | Sets or resets the current user's vote on a voteable record. |
| `POST` | `/api/user/:id/{follow,unfollow,save,unsave}` | Authenticated | Manages the current user's relationship with another user. |
| `POST` | `/api/topic/:topic/{follow,unfollow}` | Authenticated | Follows or unfollows a topic. |
| `POST` | `/api/user/:id/award` | Authenticated; token and self-award checks | Awards another user with tokens. |
| `POST` | `/api/{post,thread,gallery,link}/:id/award` | Authenticated; token and self-award checks | Transfers 256 tokens to the content author as an award. |
| `POST` | `/api/comment/:id/award` | Authenticated; token and self-award checks | Transfers 256 tokens to the comment author as an award. |
| `POST` | `/api/profile/referral` | Authenticated | Claims a referral code. |

### Vote

- Access: authenticated user; `kind` is `positive`, `misleading`, `negative`, or `reset`.
- Request: target record ID and vote kind in the path; no body.
- `200`: current vote sets for the target.
- `401`: no valid session. Target resolution and record constraints are enforced by the database operation.
- Side effects: updates the caller's vote state, removing their vote from the other categories when setting a vote.
- Source: [positive vote route](../server/api/vote/[id]/positive.ts).
- Tests: [vote API tests](../tests/parallel/votes.server.test.ts).

### User Awards

- Method: `POST /api/user/:id/award`.
- Access: authenticated; the caller cannot award themselves, a deleted user, or an already-awarded user. The caller needs 256 tokens, and the recipient must remain below the token cap.
- `200`: `{ awarded: true }`. Self-awards return `400`; missing recipients return `404`; repeated awards, deleted recipients, or balance/cap failures return `409`.
- Side effects: transfers 256 tokens and records the award in one transaction, then sends the recipient an in-app notification.
- Source: [award handler](../server/api/user/[id]/award.ts), [notification manager](../server/utils/repos/NotificationManager.ts).
- Tests: [engagement tests](../tests/parallel/engagement.server.test.ts) cover successful, duplicate, self, insufficient-balance, and concurrent awards.

## Administration and Curation

These endpoints manage privileged roles and application-wide content curation.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/admin/role/{add,remove}` | Admin | Grants or removes a role from a user. |
| `GET` | `/api/admin/pin` | Admin | Lists application pins and their moderation state. |
| `POST` | `/api/admin/pin/:id/update` | Admin | Activates or deactivates an application pin. |
| `POST` | `/api/admin/pin/:id/delete` | Admin | Deletes an application pin. |
| `POST` | `/api/{post,thread,gallery,link}/:id/archive` | Admin | Archives or restores content. |
| `POST` | `/api/{post,thread,gallery,link}/:id/pin` | Admin | Queues an application pin for content; admins activate it through `/api/admin/pin/:id/update`. |

## Platform Settings

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | [`/api/settings/:id`](#application-settings-read-and-update) | Public | Returns application settings for the requested ID. |
| `POST` | [`/api/admin/settings/:id/update`](#application-settings-read-and-update) | Admin | Updates application settings and reviews pending moderation approvals. |

### Application Settings Read and Update

- Methods: `GET /api/settings/:id` reads settings publicly; `POST /api/admin/settings/:id/update` requires an admin and accepts the complete `AppSettings` object.
- Response: reads and successful updates return the settings object. Invalid update payloads or values return `400` without changing the saved settings.
- Side effects: after persisting valid settings, the update re-evaluates pending moderator requests using the new approval threshold; qualifying approvals can grant moderator roles and topic assignments, close requests, and send notifications.
- Source: [public settings route](../server/api/settings/[id]/index.ts), [admin update route](../server/api/admin/settings/[id]/update.ts), [settings manager](../server/utils/SettingsManager.ts), [moderation manager](../server/utils/ModerationManager.ts).
- Tests: [settings tests](../tests/parallel/settings.server.test.ts) cover valid persistence and invalid-update safety; [moderation tests](../tests/parallel/moderation.server.test.ts) cover threshold reconciliation and promotion.

## Developer Operations

These routes are restricted to developers and cover database maintenance and diagnostics.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/developer/database/schema` | Developer | Reads the deployed database schema. |
| `POST` | `/api/developer/database/sync` | Developer | Applies pending database migrations. |
| `POST` | `/api/developer/database/replay` | Developer | Replays the current migration and returns its version. |
| `POST` | [`/api/developer/database/query`](#developer-database-query) | Developer | Executes a supplied SurrealQL query and records the query and results. |
| `GET` | `/api/developer/error` | Developer | Searches stored error diagnostics by request ID, status, or time range. |

### Developer Database Query

- Method: `POST /api/developer/database/query`.
- Access: authenticated developer.
- Request body: `{ query }` containing SurrealQL. Queries containing `developerQuery` are rejected with `400` so the audit table cannot be queried through this route.
- `200`: the database query's result is returned directly.
- Side effects: stores the submitted SQL and its result in `developerQuery`. Audit-write failures are logged without replacing the query result. Database errors are returned with developer-visible detail.
- Source: [query handler](../server/api/developer/database/query.ts).
- Tests: [logging tests](../tests/parallel/logging.server.test.ts) verify that malformed SQL errors are detailed for developers; a successful-query audit test is not currently present.

## Feedback and Support

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/feedback/submit` | Authenticated | Submits feedback from the current user. |
| `GET` | `/api/feedback` | Admin/developer | Lists feedback submissions and submitter details. |
| `POST` | `/api/feedback/:id/dismiss` | Admin/developer | Marks a feedback submission as dismissed. |

## Route Fallback

The [catch-all API handler](../server/api/[...].ts) handles paths that do not match a feature route. It returns `400` with the message `There is nothing here.` This fallback is not a feature endpoint and is excluded from the route-table path comparison.