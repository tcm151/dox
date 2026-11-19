# Ticket 0134: Wiki-Style Forum Support Epic

## Status
- State: `Planned`
- Priority: `Low`
- Next: Define the core wiki page and collaboration workflows.

## Goal
Expand ClassicForum to support wiki-style community forums with structured, collaborative pages connected to discussion. This epic coordinates the product scope and linked implementation tickets for page history, permissions, navigation, and discussion.

## Requirements
- [ ] The agreed scope covers structured wiki articles, collaborative editing and permissions, revision history and restore, hierarchical or categorized navigation, and discussion attached to wiki pages.
- [ ] The page model and user workflows define ownership, editing and moderation permissions, revision behavior, page organization, and how wiki discussion relates to existing forum content.
- [ ] Implementation is divided into linked child tickets with distinct, testable acceptance criteria and explicit dependencies.
- [ ] Wiki support is not described as available in releases or public materials until its implementation tickets are complete and verified.

## Tasks
- [ ] Define the target wiki workflows and how wiki pages relate to existing posts, threads, topics, and collections.
- [ ] Agree the collaboration model, permission boundaries, revision and restore behavior, page organization, and attached-discussion experience.
- [ ] Create and link scoped child tickets for the agreed data model, authoring, access control, history, navigation, discussion, and validation work.
- [ ] Keep roadmap and public feature descriptions aligned with verified delivery milestones.

## Notes
- The scope above reflects the requested capabilities: structured pages/articles, edit history and restore, collaborative editing and permissions, hierarchical/category navigation, and page-attached discussion.
- This is the umbrella ticket; no implementation child tickets are created yet. Add links as scope is agreed and work is split.
- Related backlog: [0092](0092-series-collection-grouping.md) covers ordered post/thread collections; [0093](0093-content-revision-history-foundation.md), [0094](0094-post-revision-history.md), and [0095](0095-thread-revision-history.md) cover post/thread history, not wiki pages; [0017](0017-topic-rules-history-page.md) covers topic rule history. These are context, not prerequisites.
- [0129](../0129-complete-public-adoption-entrypoints.md) says unfinished wiki workflows must not be presented as supported.

## Relevant Files
- docs/Roadmap.md
- app/pages/editor/
- app/pages/topic/
- app/pages/post/
- app/pages/thread/
- shared/types/index.ts
- server/assets/schema.surql
- server/assets/migrations/

## Progress Log
- 2026-11-19: Ticket created.
