# Ticket 0129: Complete Public Adoption Entrypoints

## Status
- State: Planned
- Priority: Medium
- Next: Inventory the README and demo paths an anonymous visitor follows to understand, install, and get help with ClassicForum.

## Dependencies
- [0127](0127-publish-a-verifiable-pilot-release.md): The completed operator journey must link to an actual supported download rather than a placeholder.
- [0128](0128-verify-demo-navigation-and-hydration.md): Final anonymous demo/walkthrough verification requires the recorded navigation and rendering issues to be resolved or explained.

## Goal
Connect the repository and public demonstration to a clear self-hosting journey. Describe what operators can actually install and use without confusing the project with its host site's identity or unfinished features.

## Requirements
- [ ] The README prominently separates the Production Quickstart and supported download from contributor setup and provides clear Demo, Install, and Get Help links.
- [ ] An anonymous demo visitor can discover a concise ClassicForum introduction, representative public discussion/gallery examples, installation requirements, and support destinations using existing pages/topics/pins.
- [ ] A checked screenshot set or short walkthrough demonstrates only available workflows using approved accounts/content and excludes private moderation/account data.
- [ ] Public feature descriptions distinguish implemented source, the supported release, and enabled/verified demo behavior; audio, wiki, store, and other unfinished workflows are not presented as supported.
- [ ] Project naming and repository links are consistent while preserving configurable instance branding; redirects alone are not treated as broken links or a reason to rename the application.
- [ ] The complete introduction-to-content-to-download-to-install-to-help path is checked anonymously, with working destinations and no contributor build requirement.

## Tasks
- [ ] Identify the canonical project/repository destination and the supported release's actual feature scope.
- [ ] Update the README's operator/contributor entrypoints and unsupported feature claims.
- [ ] Prepare an introduction and clearly identified examples with existing demo organization features, obtaining approval before publishing site content.
- [ ] Create or refresh the checked screenshots/walkthrough and verify every advertised link.
- [ ] Coordinate hosting and support links with [0131](0131-document-pilot-hosting-requirements-and-limits.md) and [0132](0132-publish-operator-support-guidance-and-bug-intake.md).

## Notes
- The 2026-11-17 adoption review identified a contributor-only README Quick Start, an audio-support claim, and a demo introduction that was not immediately discoverable.
- Use the existing configured About summary, topics, and pins where appropriate; verify affected routes through [0128](0128-verify-demo-navigation-and-hydration.md) before relying on them.
- Completed [0117](completed/0117-reconcile-roadmap-and-completion-evidence.md) reconciles the roadmap. This ticket owns the visitor-facing description and adoption path, not removal of unfinished work from the roadmap.
- A pilot can have a narrower supported feature set than the full roadmap. Do not promise importers, managed hosting, unlimited media, or a particular community capacity.

## Relevant Files
- README.md
- CHANGELOG.md
- app/pages/about.vue
- app/pages/contact.vue
- docs/Quickstart.md
- docs/ContributionGuide.md

## Progress Log
- 2026-11-17: Recorded demo reliability as a completion prerequisite alongside the actual download; content drafting and unrelated support/hosting work remain parallel.
- 2026-11-17: Ticket created. No README, demo content, branding, or deployment changes were made.
