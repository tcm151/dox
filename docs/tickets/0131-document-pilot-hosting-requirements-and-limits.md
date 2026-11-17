# Ticket 0131: Document Pilot Hosting Requirements And Limits

## Status
- State: Planned
- Priority: Medium
- Next: Select one pilot deployment profile and define the measurements needed for a bounded operator baseline.

## Goal
Help prospective operators estimate whether the supported configuration suits their small community. Publish observed requirements and clear limits rather than unsupported capacity, cost, migration, or discoverability claims.

## Requirements
- [ ] Guidance identifies the tested OS/architecture, Node.js version, database mode, storage layout, and reverse-proxy/TLS responsibilities.
- [ ] A repeatable bounded measurement records idle and representative text/image workload memory, CPU, disk use/growth, and backup storage needs with the hardware, dataset, duration, and candidate version.
- [ ] Measured observations are distinguished from minimum requirements or capacity guarantees; untested community sizes, platforms, and media-heavy workloads remain explicitly unverified.
- [ ] Operators can find applicable upload sizes, media/token constraints, email-spool behavior, and configuration references without relying on broad unlimited-media claims.
- [ ] Hosting, storage, email, and off-server backup cost considerations are documented without presenting the project's budget or unverified vendor prices as an operator quote.
- [ ] Public-content indexing expectations and limitations are checked and documented; in-app search is not presented as proof of external search-engine indexing.
- [ ] Manual migration/import limitations and operator-owned hosting/backup responsibilities are clear, and the guide is linked from the installation/adoption documentation.

## Tasks
- [ ] Reuse the deployment profile and evidence from [0118](0118-close-public-release-validation-gaps.md) where applicable and define a small representative workload.
- [ ] Collect the bounded baseline in an authorized environment and retain reproducible measurement details.
- [ ] Reconcile actual configured media/email limits with existing architectural recommendations.
- [ ] Check the supported release's public-content indexing behavior before describing it.
- [ ] Publish operator-facing requirements, limitations, and cost considerations and link them from the Quickstart/adoption path.

## Notes
- Hosting costs, media limits, migration effort, search-engine indexing, and capacity need documentation or measurement.
- Completed [0064](completed/0064-anti-spam-defaults.md) supplies recommended policy defaults, not a measured hosting baseline.
- Keep embedded mode as the initial baseline and remote SurrealDB as an advanced option unless the pilot configuration is explicitly changed.
- This is not a broad load-testing program, SEO implementation project, importer, or automatic cloud-cost calculator. Record unknowns rather than adding optional features to satisfy a marketing claim.
- Coordinate public links with [0129](0129-complete-public-adoption-entrypoints.md) and distinguish this evidence from basic install/recovery acceptance.

## Relevant Files
- docs/Quickstart.md
- docs/Backups.md
- docs/SurrealDB.md
- docs/Architecture.md
- README.md
- nuxt.config.ts

## Progress Log
- 2026-11-17: Ticket created. No hosting measurements, cost estimates, indexing checks, or capacity validation were performed.
