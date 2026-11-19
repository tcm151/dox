# Ticket 0132: Publish Operator Support Guidance And Bug Intake

## Status
- State: `In Progress`
- Priority: Medium
- Next: Confirm the public support destinations and best-effort response expectations for the pilot.

## Goal
Publish discoverable support guidance and useful, safe bug intake. Keep limited project support distinct from operating adopters' infrastructure or moderating their communities.

## Requirements
- [ ] A visitor can find a monitored pre-registration contact and installation help without submitting login-gated built-in feedback.
- [ ] Guidance identifies destinations for general help, reproducible bugs, feature proposals, private vulnerability reports, and content complaints about an adopter's instance.
- [ ] Public policy states best-effort availability, supported deployment scope, pilot-assistance limits, and the absence of uptime or emergency-response guarantees without promising an unapproved service level.
- [ ] A minimal structured bug-report template requests app version, OS/architecture, database mode, reproduction steps, expected/actual results, and redacted diagnostics.
- [ ] Reporting instructions explicitly exclude passwords, access tokens, private databases, and unredacted environment files; suspected vulnerabilities stay on the private security path.
- [x] An operator FAQ/troubleshooting section covers initial setup, SMTP, media limits, upgrades, and complete backups through links to authoritative guidance rather than copied procedures.
- [ ] README/demo help links lead to the published destinations, and intake instructions distinguish built-in administrator feedback from a public support discussion.

## Tasks
- [ ] Confirm usable destinations, ownership, and sustainable support wording before publishing promises.
- [ ] Publish concise public support guidance using the repository and existing forum topics/contact facilities.
- [x] Add the minimal bug-report template using existing GitHub mechanisms.
- [x] Seed the FAQ from known installation issues and grow it from recurring pilot questions.
- [ ] Verify anonymous access to the help/contact path and its links to installation, release limitations, and private security reporting.

## Notes
- The support policy, public contact paths, and intake materials still need to be published and checked.
- Completed [0031](completed/0031-security-policy-disclosure.md) supplies the private vulnerability process. Reuse it rather than creating a competing security contact or disclosure policy.
- Coordinate help links with [0129](0129-complete-public-adoption-entrypoints.md), SMTP guidance with [0130](0130-verify-smtp-and-first-upload-onboarding.md), and operator limits with [0131](0131-document-pilot-hosting-requirements-and-limits.md).
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
- 2026-11-18: The example deployment's Contact page displays email links and built-in Feedback. The owner identifies this as a personal blog, not project onboarding; monitoring and approval as project support channels are unconfirmed. No feedback was submitted.
- 2026-11-18: Operator Help covers setup, SMTP, media limits, upgrades, backups, and issue reporting; README links it and the supported v2026.6.3 archive/checksum. A monitored contact and response expectations remain unresolved.
- 2026-11-18: Added a public bug form for version, platform, database mode, reproduction, expected/actual results, and redacted diagnostics. Support destinations remain unconfirmed.
- 2026-11-17: Ticket created. No public support content, issue templates, contact details, or deployment settings were changed.
