# Changelog

ClassicForum uses `year.major.patch` versions. `package.json` is the source of truth for the current application version.

Backfilled entries are retroactive release blocks based on Git commit history. They group runs of days, weeks, or months where related work produced significant application changes.

## [2026.5.0] - 2026-07-21

### Added
- Added package-owned application versioning with the Nuxt public runtime version read from `package.json`.
- Started this changelog and documented the `year.major.patch` release strategy.
- Added planning tickets for developer diagnostics and fullscreen editor viewport bounds.

### Changed
- Completed the editor shortcuts expansion ticket and cleaned up the markdown editor workflow.
- Moved lower-priority planning tickets into the backlog.
- Hid unsupported submission types while their editors remain unfinished.

### Fixed
- Fixed editor navigation links, incorrect documentation links, and a null handling issue found during editor cleanup.

## [2026.4.0] - 2026-04-13

### Added
- Added deployment and operations planning around Docker, embedded data paths, and production documentation.
- Added a broader roadmap and ticket set for moderation, security, operations, product, and contributor work.
- Added a Docker template and cleaned up example environment configuration.

### Changed
- Updated project branding and roadmap structure.
- Renamed media paths and removed unnecessary setup pieces from the deployment direction.

## [2026.3.0] - 2026-04-09 to 2026-04-12

### Added
- Added early support for more submission types, topic-specific reports, following feeds, improved notifications, and draft save shortcuts.
- Added media uploader handling improvements and moderator tooling improvements.
- Added safeguards around the developer query audit table.

### Changed
- Improved tab caching, dynamic sizing, query result tab display, and feed switching between popular and following views.

### Fixed
- Fixed compatibility issues and miscellaneous early UI/application cleanup items.

## [2026.2.0] - 2026-04-02 to 2026-04-06

### Added
- Added dedicated topic moderators, related topics, follower/following/topic pages, and topic enable/disable controls.
- Added safer media deletion planning and expanded the backlog of documented follow-up work.
- Added request IP handling and fallback behavior for missing data.

### Changed
- Improved the internal tabstrip, media path configuration, topic moderation UX, developer query experience, and active navigation state.
- Continued account migration cleanup and confirmation table updates.

### Fixed
- Fixed draft saving, deployment issues, missing default settings, account migration leftovers, and award token checks.

## [2026.1.0] - 2026-03-29 to 2026-03-30

### Added
- Migrated the project to the Nuxt 4 folder structure and began the account table migration.
- Added account migration planning, validation cleanup, and initial test-suite exploration.

### Changed
- Removed development environment bypasses and cleaned up after the folder migration.
- Improved error reporting, form styling, ordering, and client error visibility.

### Fixed
- Patched confirmation/referral risks and removed known security risks from the development flow.

## [2023.9.0] - 2023-12-01 to 2023-12-11

### Added
- Added `TopicField`, basic thread feeds, a thread editor, thread index page, and thread-focused mobile UX improvements.
- Added full-text search across posts, threads, and comments.
- Added contribution guide groundwork and CODEOWNERS.

### Changed
- Reorganized feed, topic, thread, and component structure for clearer shared list rendering.
- Improved post preview UX, migration handling, report UX, and database sync error reporting.

### Fixed
- Fixed schema download, migration, tree collapse, type hint, and cache edge cases.

## [2023.8.0] - 2023-11-03 to 2023-11-21

### Added
- Added a table sync system, basic topics display, misc developer page, toggle form component, cache system, active pins, and feed pin display.
- Added image display in feeds and improved the images feed with popup details, report, and delete actions.

### Changed
- Overhauled backend behavior for SurrealDB v1 standards and upgraded Nuxt/package dependencies.
- Standardized tags, fonts, previews, sorting methods, admin tabs, and window/image styling.
- Improved topic feeds, following/unfollowing, admin feedback, auth handling, and token/database connection cleanup.

### Fixed
- Fixed auth logic after SurrealDB updates, comment editing JSON, comment notification context, type imports, editor scrolling, and tag sizing.

## [2023.7.0] - 2023-07-20 to 2023-10-11

### Added
- Completed the backend query migration and added new developer pages.
- Added store/referrals, post awards, award notifications, forgot/reset password, post replies, settings pages, and admin pin management.
- Scaffolded messages and threads, added shared validation, and introduced backup typing and environment-specific backups.

### Changed
- Improved image display, page sizes, hints, store mobile layout, reply navigation, colors, tabstrips, feed ordering, and trending topic windows.
- Updated packages and removed outdated pipeline/deployment pieces.

### Fixed
- Fixed voting breakages, posting to the wrong table, positive vote overwrites, post fetching with reply targets, database error responses, animations, and editor border radius.

## [2023.6.0] - 2023-06-01 to 2023-07-14

### Added
- Added server-rendered markdown/highlighting work, codeblock rendering, chat and embedding experiments, knowledge-search groundwork, SEO image metadata, and transition animations.
- Added token-based image upload costs/refunds, post deletion, report screen improvements, rebuilt notifications, awards/saves in post lists, multiple feeds, and settings token display.

### Changed
- Upgraded Nuxt/packages, simplified datasources, improved mobile viewport behavior, profile refresh, notification reload behavior, and editor/post/comment layout responsiveness.

### Fixed
- Fixed SurrealDB version issues, middleware client behavior, window-height/page-height issues, report and notification flows, invalid date handling, and security flaws found during cleanup.

## [2023.5.0] - 2023-04-28 to 2023-05-18

### Added
- Finalized image typing and added support for multiple image formats including PNG and GIF uploads.
- Added reporting groundwork, post-editor image uploads, account confirmation email, deploy script, production file handling, and the initial README.
- Added DOMPurify sanitization, backup of important tables, elapsed time display, and saved feed filter type.

### Changed
- Moved settings toward the user page, consolidated styles, organized utilities, and moved request authentication into a shared utility.
- Switched image/email/runtime behavior to use environment variables and base URLs.

### Fixed
- Fixed upload SQL typos, file crumbs, delete directory handling, login cleanup, multiquery error checking, post image inclusion, comment hash links, production image issues, wrong confirmation email URL/subject, and editor title overflow.

## [2023.4.0] - 2023-04-11 to 2023-04-27

### Added
- Added feed datasource work, catch-all API routing, admin panel/tabs, feedback from error pages/navbar, feedback endpoints, error logging, file directory browsing, and SMTP email support.
- Added page views/SEO tracking, arrow-key pagination, post visit display, and follower endpoint work.

### Changed
- Upgraded SurrealDB/Nuxt pieces, reorganized layouts/colors/services, moved drafts into their own component, and converted topics into a table.
- Improved register, login, tag, feedback, mobile hint, code block, feed, and admin tab UX.

### Fixed
- Fixed editor topic display, image paths, missing environment logging, broken triggers, inline code styling, login failure messaging, time display, multi-code-block rendering, database wait-on-connect, feed regressions, filtering, edit-post parameters, and logout behavior.

## [2023.3.0] - 2023-03-23 to 2023-04-09

### Added
- Added markdown preview/highlighting, API docs, dark colors, database parameters, improved draft deletion/update, admin feedback direction, stars/saves groundwork, and preview/action icons.

### Changed
- Reworked login after a register breakage, upgraded packages, moved comments to the post endpoint, improved the home page, reorganized types/styles/session state, and adopted Luxon for dates.

### Fixed
- Fixed voting issues, feed refresh behavior, post reply display, and several style/layout regressions.

## [2023.2.0] - 2023-03-14 to 2023-03-22

### Added
- Added CI/deployment pipeline experiments, settings work, markdown preview planning, default component style imports, improved posting experience, markdown code block sanitization/styling, spinners, drafts, and notification improvements.

### Changed
- Upgraded Nuxt/packages, restructured API routes, improved query formatting, and refined app styling.

### Fixed
- Fixed undefined API route parameters, broken URLs, viewport overflow, and early deployment build issues.

## [2023.1.0] - 2023-02-02 to 2023-02-17

### Added
- Built the initial forum core with posts, comments, comment trees, topics, profiles, feeds, user pages, auth-backed database writes, following, editing posts, notifications, settings, voting, and trending topics.
- Added reusable date formatting, hints, feed components, topic/profile pages, and early public-beta preparation.

### Changed
- Updated Nuxt, renamed composables, moved API helpers, improved responsiveness, and refined time abbreviations and the mission statement.

### Fixed
- Fixed render timing, session token issues, abusive API paths, auth slowness, public database connection reuse, following button state, and signed-out follow behavior.