# Ticket 0126: Reuse Record Context Navigation Mapping

## Status
- State: Planned
- Priority: Low
- Next: Inventory record-context destinations and the existing comment/report navigation exceptions.

## Goal
Give inbox, report, and appeal navigation one small, explicit mapping from record context to supported destinations. Reuse record parsing without duplicating delimiter replacements or erasing workflow-specific routing.

## Requirements
- [ ] Shared destination construction uses parseRecordId or extractId rather than independently splitting and replacing record-ID delimiters.
- [ ] Only supported record tables map to public UI destinations; arbitrary database tables are not assumed to be public routes.
- [ ] Notification report contexts continue to open the owner appeal route, and comment contexts retain their existing redirect/anchor behavior.
- [ ] Moderator comment-report links continue to navigate to the correct containing discussion and encoded comment anchor.
- [ ] Direct content and profile links retain their current destinations, history behavior, and relevant scroll restoration.
- [ ] Invalid or unsupported contexts follow an explicit, surfaced error policy rather than silently navigating to a malformed URL.
- [ ] Focused mapping and browser tests cover normal content, profiles, report appeals, comments on post/link/gallery discussions, and invalid contexts.

## Tasks
- [ ] Compare destination construction in inbox, appeal, and report queue callers.
- [ ] Reuse the existing record parser and extract only the genuinely common route mapping.
- [ ] Keep workflow exceptions explicit through the smallest useful helper contract rather than a general routing registry.
- [ ] Migrate the inspected callers and add destination/anchor regression coverage.

## Notes
- Inbox still special-cases reports and comments. The report queue now receives the comment context as a record ID and still constructs the containing discussion path and anchor independently; appeal still constructs its own destination.
- Not every raw record-type check needs this helper; leave local display-only type checks alone unless reusing the parser clearly improves their contract.
- Completed Ticket 0074 concerns database relationships, and Ticket 0083 covers existing inbox behavior. Preserve that behavior rather than redesigning notification navigation.

## Relevant Files
- shared/utils/records.ts
- app/pages/inbox.vue
- app/pages/appeal/[id].vue
- app/components/lists/ReportQueueItem.vue
- server/routes/comment/[id].ts
- tests/sequential/21-account.browser.test.ts
- tests/sequential/18-reports.server.test.ts
- tests/parallel/navigation.browser.test.ts

## Progress Log
- 2026-11-17: Ticket created from the developer consistency review as a low-priority consistency improvement. Navigation was not runtime-verified.
