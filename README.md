# ClassicForum

Own your community. Host it yourself. Shape it your way.

ClassicForum is a self-hosted, modern forum platform for people who want an alternative to closed platforms like Discord, heavily centralized networks like Reddit, and aging forum software stacks. It is designed for public communities, niche interests, and creators who want full control over how their space looks, works, and grows.

## Why ClassicForum?

- **You own the platform**: run it on your own hardware or cloud server.
- **You own the rules**: moderate and manage the community how you want.
- **You own the experience**: customize behavior, features, and branding for your audience.
- **Built for open communities**: great for discussion boards, personal blogs, topic hubs, and hybrid forum/blog use cases.

## What You Get

- **Forum + feeds** with posts, threads, topics, discover views, and search.
- **Richer thread conversations** with replies, quoting, editing, and thread chains.
- **Profiles and authentication** with multi-login session flows and account switching.
- **Image media** for uploads, browsing, and detail pages. Audio publishing is disabled and unfinished.
- **Voting, reporting, and moderation tools** for healthy public communities.
- **Admin and developer areas** for role management, reports, feedback, configuration, and database operations.
- **Self-host friendly architecture** powered by Nuxt and SurrealDB 3, with support for local embedded setups or remote database deployments.

## Who It’s For

- Community builders leaving closed chat-first platforms.
- Independent creators who want a public, searchable home for their content.
- Teams and hobby groups that want a classic forum feel with a modern stack.
- Self-hosters who prefer owning their data, uptime, and roadmap.

## Quick Start

For operators, download the supported [v2026.6.3 Linux x64 archive](https://github.com/tcm151/dox/releases/download/v2026.6.3/forum-2026.6.3-linux-x64.tar.gz) and its [SHA-256 file](https://github.com/tcm151/dox/releases/download/v2026.6.3/forum-2026.6.3-linux-x64.tar.gz.sha256), then follow the [Production Quickstart](./docs/Quickstart.md) and [Operator Help](./docs/Support.md). To build from source, see [Contributing](./docs/Contributing.md).

## Deployment Types

### Remote SurrealDB

- Best for: dedicated database hosts, shared infrastructure, or multi-service deployments.
- App connects over RPC with configured credentials.
- Configure: set `NUXT_SURREAL_INFO_TYPE=remote` and `NUXT_SURREAL_INFO_URL=http://<host>:<port>/rpc`.

### Embedded SurrealDB

- Best for: single-node self-hosting and simpler local deployments.
- App starts SurrealDB via embedded engines inside the server process.
- Configure: set `NUXT_SURREAL_INFO_TYPE=embedded` and `NUXT_SURREAL_INFO_URL=rocksdb://<path-to-db-file>`.

## Project Status

ClassicForum is an active passion project, originally built for personal publishing and community discussion. If this direction resonates with you, star the repository and open issues with feedback or ideas.

## Releases

ClassicForum uses package-owned `year.major.patch` versions. See [CHANGELOG.md](./CHANGELOG.md) for release notes.

## License

ClassicForum is released under the MIT License. See [LICENSE](./LICENSE).

## Philosophy

The internet works best when communities can be independently run, publicly accessible, and not locked behind someone else’s platform decisions. ClassicForum exists to make that path easier.
