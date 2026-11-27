# Ticket 0132: Publish Operator Support Guidance And Bug Intake

## Status
- State: `In Progress`
- Priority: Medium
- Next: Publish the approved Operator Help and security policy updates, then recheck the public links while signed out of GitHub.

## Goal
Publish discoverable support guidance and useful, safe bug intake. Keep limited project support distinct from operating adopters' infrastructure or moderating their communities.

## Requirements
- [ ] A visitor can find a monitored pre-registration contact and installation help without submitting login-gated built-in feedback.
- [ ] Guidance identifies destinations for general help, reproducible bugs, feature proposals, private vulnerability reports, and content complaints about an adopter's instance.
- [ ] Public policy states best-effort availability, supported deployment scope, pilot-assistance limits, and the absence of uptime or emergency-response guarantees without promising an unapproved service level.
- [x] A minimal structured bug-report template requests app version, OS/architecture, database mode, reproduction steps, expected/actual results, and redacted diagnostics.
- [x] Reporting instructions explicitly exclude passwords, access tokens, private databases, and unredacted environment files; suspected vulnerabilities stay on the private security path.
- [x] An operator FAQ/troubleshooting section covers initial setup, SMTP, media limits, upgrades, and complete backups through links to authoritative guidance rather than copied procedures.
- [ ] README/demo help links lead to the published destinations, and intake instructions distinguish built-in administrator feedback from a public support discussion.

## Tasks
- [x] Confirm usable destinations, ownership, and sustainable support wording before publishing promises.
- [ ] Publish concise public support guidance using the repository and existing forum topics/contact facilities.
- [x] Add the minimal bug-report template using existing GitHub mechanisms.
- [x] Seed the FAQ from known installation issues and grow it from recurring pilot questions.
- [ ] Verify anonymous access to the help/contact path and its links to installation, release limitations, and private security reporting.

## Notes
- The maintainer confirmed that they monitor GitHub Issues and approved it for setup questions. The approved policy covers best-effort help for the latest Linux x64 release and documented setups, with no uptime, emergency, or response-time guarantees. The local Operator Help update is ready; publication and public link validation remain open.
- The README and demo About page point to Operator Help. A visitor can read GitHub Issues without an account and needs a GitHub account to post, not a ClassicForum account. The demo's Contact page and built-in feedback remain instance channels, not project support.
- The security policy now links to the latest stable release instead of naming a fixed version. Its response targets apply to vulnerability reports, not general support. The GitHub forms require GitHub sign-in; visitors do not need a ClassicForum account to find the links.
- Completed Ticket 0031 supplies the private vulnerability process. Reuse it rather than creating a competing security contact or disclosure policy.
- Coordinate help links with Ticket 0129, SMTP guidance with Ticket 0130, and operator limits with Ticket 0131.
- Keep outreach invitations, adoption spreadsheets, and recurring support scheduling separate from application implementation work. No helpdesk service, app telemetry, or managed-hosting offering is required.
- Publishing contact details or changing demo topics/settings requires approval; do not infer consent from this ticket.

## Relevant Files
- README.md
- SECURITY.md
- docs/Contributing.md
- docs/Quickstart.md
- docs/Support.md
- docs/Backups.md
- app/pages/contact.vue
- .github/
- .github/ISSUE_TEMPLATE/bug_report.yml

## Progress Log
- 2026-11-27: Rechecked the demo About page and the linked Production Quickstart and Operator Help destinations without a ClassicForum or GitHub session. Both GitHub docs rendered this time. The published Operator Help still lacks the approved setup-question link and best-effort wording; recheck those after publication.
- 2026-11-27: The maintainer approved GitHub Issues as the monitored setup channel and confirmed the best-effort support scope. Added the guidance to Operator Help locally. Publication and a fresh public link check are still needed.
- 2026-11-27: Verified that the GitHub Issues list is readable while signed out of GitHub. The bug form and private reporting URLs redirected to GitHub sign-in and preserved their destinations. Operator Help and Production Quickstart returned GitHub HTTP 503 during this pass, so the public link check remains open. No reports were submitted.
- 2026-11-27: Opened Operator Help from the example deployment's About page and confirmed that the bug report, feature proposal, and private vulnerability links were displayed. Did not submit a report, verify who monitors a help channel, or treat the example site as project support.
- 2026-11-27: Compared the README, Operator Help, and issue template with the checklist. The written reporting paths and redaction guidance are in place. A monitored general-help destination, support limits, and anonymous link checks remain open.
- 2026-11-27: Confirmed the structured fields and redaction guidance in the issue template. Public intake availability and monitoring were not checked.
- 2026-11-18: The example deployment's Contact page displays email links and built-in Feedback. The owner identifies this as a personal blog, not project onboarding; monitoring and approval as project support channels are unconfirmed. No feedback was submitted.
- 2026-11-18: Operator Help covers setup, SMTP, media limits, upgrades, backups, and issue reporting; README links it and the supported v2026.6.3 archive/checksum. A monitored contact and response expectations remain unresolved.
- 2026-11-18: Added a public bug form for version, platform, database mode, reproduction, expected/actual results, and redacted diagnostics. Support destinations remain unconfirmed.
- 2026-11-17: Ticket created. No public support content, issue templates, contact details, or deployment settings were changed.
