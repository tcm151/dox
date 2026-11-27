# Ticket 0129: Complete Public Adoption Entrypoints

## Status
- State: `In Progress`
- Priority: Medium
- Next: Approve the public examples to link from About and decide whether to add a gallery example before publishing the README Demo link.

## Goal
Connect the repository and public demonstration to a clear self-hosting journey. Describe what operators can actually install and use without confusing the project with its host site's identity or unfinished features.

## Requirements
- [ ] The README prominently separates the Production Quickstart and supported download from contributor setup and provides clear Demo, Install, and Get Help links. Demo opens `https://forum.tcmdev.ca/about`; Get Help opens the repository's Operator Help, not the demo's Contact page.
- [ ] An anonymous demo visitor can discover a concise ClassicForum introduction, representative public discussion/gallery examples, installation requirements, and support destinations using existing pages/topics/pins.
- [ ] A checked screenshot set or short walkthrough demonstrates only available workflows using approved accounts/content and excludes private moderation/account data.
- [ ] Public feature descriptions distinguish implemented source, the supported release, and enabled/verified demo behavior; audio, wiki, store, and other unfinished workflows are not presented as supported.
- [ ] Project naming and repository links are consistent while preserving configurable instance branding; redirects alone are not treated as broken links or a reason to rename the application.
- [ ] The complete introduction-to-content-to-download-to-install-to-help path is checked anonymously, with working destinations and no contributor build requirement.

## Tasks
- [x] Confirm the public demo host with the owner.
- [ ] Identify the canonical project/repository destination and the supported release's actual feature scope.
- [x] Update the README's operator/contributor entrypoints and unsupported feature claims.
- [ ] Review the existing About copy, ClassicForum topic, and public posts, threads, and galleries. Reuse suitable examples and get approval for any missing content or production changes.
- [x] Verify that the About page, representative post and thread details, the published release listing, Production Quickstart, and Operator Help are accessible while signed out.
- [ ] Verify the complete About-to-content-to-download-to-install-to-help path after the example links and updated support guidance are published. Capture only public pages if screenshots are needed.
- [ ] Add the README Demo link after the signed-out walkthrough and verify the README entrypoints again.
- [ ] Coordinate hosting and support links with Tickets 0131 and 0132.

## Notes
- The 2026-11-17 adoption review identified a contributor-only README Quick Start, an audio-support claim, and a demo introduction that was not immediately discoverable.
- The owner approved `forum.tcmdev.ca` as the public ClassicForum demo. Keep the site's existing identity and content; use `/about` to explain the project and direct visitors to examples, installation, and help. Demo approval does not authorize production changes or make the site's Contact page a project support channel.
- The current README points to the GitHub Releases listing, Quickstart, and Support, separately from Contributing. Quickstart identifies the Linux x64 archive and checksum. The same three links opened from the demo's About page. Add the README demo link only after the anonymous path is checked.
- Signed-out checks on `v2026.6.6` confirmed the existing SurrealDB post and the release-update discussion under the ClassicForum topic as possible examples. The About page does not directly link to those examples, and the Galleries feed had no public results. Choose examples and approve any About or gallery changes before linking the demo from the README.
- Proofread the README and any approved demo About copy together. The example About page and the README share the typos `operatred`, `Discoverablity`, and `taking a lookg`.
- Use the existing configured About summary, topics, and pins where appropriate; verify affected routes against the findings in Ticket 0128 before relying on them.
- Completed Ticket 0117 reconciles the roadmap. This ticket owns the visitor-facing description and adoption path, not removal of unfinished work from the roadmap.
- A pilot can have a narrower supported feature set than the full roadmap. Do not promise importers, managed hosting, unlimited media, or a particular community capacity.

## Relevant Files
- README.md
- CHANGELOG.md
- app/pages/about.vue
- app/pages/contact.vue
- docs/Quickstart.md
- docs/Contributing.md
- docs/Support.md

## Progress Log
- 2026-11-27: Verified `/about`, an existing post's direct URL, and the ClassicForum topic and its thread in the signed-out shared tab. The thread and its reply rendered; in-app navigation showed an authentication error even though a direct load did not show it. The public release listed the Linux x64 archive and checksum, and the Quickstart and published Operator Help opened without signing in to GitHub. No archive was downloaded or installed in this pass.
- 2026-11-27: The owner approved `forum.tcmdev.ca` as the public demo. Kept the demo work in this ticket and planned to use `/about` as its entry point. Production and the README demo link were left unchanged pending content review and anonymous verification.
- 2026-11-27: Opened an existing post from the Posts feed and reloaded its `/post/...` URL. The post rendered at the same address instead of redirecting to `/feed`. This was a signed-in check on the example deployment, not approval to use it as the public demo.
- 2026-11-27: Direct navigation to `/about` stayed on that route, and an existing public thread opened from the ClassicForum topic. Both checks used the signed-in example deployment on `v2026.6.6`. The anonymous path and direct `/post/...` entry were not checked.
- 2026-11-27: Followed the example deployment's About links to Releases, Production Quickstart, and Operator Help in the shared browser. All three loaded, and GitHub showed `v2026.6.6` as Latest. This was not a signed-out walkthrough of an approved demo.
- 2026-11-27: Removed the publication prerequisite after Ticket 0127 closed with the supported Linux x64 archive available. The approved demo and anonymous end-to-end check remain open.
- 2026-11-27: Reconciled the rewritten README with the adoption checklist. Source links are present for release downloads, installation, and help; the approved demo, examples, and anonymous end-to-end check remain open.
- 2026-11-18: In-app About and a public post opened from the feed, but direct GETs to `/about` and an existing `/post/...` URL returned HTTP 302 to `/feed` from Nginx. The introduction-to-content path remains unverified pending proxy inspection; checks were signed in.
- 2026-11-18: README separates production install from source setup, uses canonical config names, avoids claiming unfinished audio support, and links Operator Help. The supported v2026.6.3 Linux x64 archive and checksum are now linked; demo verification and approved public support destinations remain open.
- 2026-11-17: Recorded demo reliability as a completion prerequisite alongside the actual download; content drafting and unrelated support/hosting work remain parallel.
- 2026-11-17: Ticket created. No README, demo content, branding, or deployment changes were made.
