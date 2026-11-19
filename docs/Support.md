# Operator Help

## Setup
Start with the [Production Quickstart](Quickstart.md). For startup or health failures, check `../logs/installer.log`, `../logs/forum.log`, and `journalctl -u forum`.

## Email
SMTP is optional. The release's `.env.example` lists the `NUXT_SMTP_*` settings; see [Quickstart](Quickstart.md#configure-environment) for shared `.env` setup. Check provider settings and the app log if delivery fails. See [Hosting](Hosting.md#current-limits-and-responsibilities) for spool limits. Test delivery to an owned mailbox before relying on transactional mail.

## Images
Uploads require a confirmed account and must fit the configured size limit. See [Hosting](Hosting.md#current-limits-and-responsibilities).

## Upgrades
Back up before upgrading. If readiness fails after activation, do not start an older release against a migrated database. See [Quickstart](Quickstart.md#upgrade) and [Backup And Restore](Backups.md).

## Backups
The embedded installer backup contains the database, not `.env` or media. Remote databases use a separate procedure. See [Backup And Restore](Backups.md).

## Reports
- Reproducible bugs: use the [bug report form](https://github.com/tcm151/dox/issues/new?template=bug_report.yml).
- Feature proposals: use [GitHub issues](https://github.com/tcm151/dox/issues).
- Suspected vulnerabilities: use the private process in [SECURITY.md](../SECURITY.md).
- Content complaints about another forum: contact that forum's operators.
- Built-in feedback goes to the forum's administrators, not the ClassicForum project.
