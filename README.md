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
- **Media support** for image and audio uploads, browsing, and detail pages.
- **Voting, reporting, and moderation tools** for healthy public communities.
- **Admin and developer areas** for role management, reports, feedback, configuration, and database operations.
- **Self-host friendly architecture** powered by Nuxt and SurrealDB 3, with support for local embedded setups or remote database deployments.

## Who It’s For

- Community builders leaving closed chat-first platforms.
- Independent creators who want a public, searchable home for their content.
- Teams and hobby groups that want a classic forum feel with a modern stack.
- Self-hosters who prefer owning their data, uptime, and roadmap.

## Quick Start

If you want to run or contribute locally, follow the [Contribution Guide](./docs/ContributionGuide.md).

## Docker (Basic Template)

A minimal Docker template is included for single-container self-hosting with embedded SurrealDB.

1. Create your env file from the shared template:

```bash
cp docs/.env.example .env
```

2. For Docker, update these values in `.env`:

```dotenv
BASE_URL=http://localhost:3000
SURREAL_URL=rocksdb:///app/data/classicforum.db
MEDIA_PATH=/app/data
SURREAL_DATABASE=production
```

3. Build and start:

```bash
docker compose up --build -d
```

4. Open the app at `http://localhost:3000`.

Data is persisted in the named Docker volume `classicforum_data` mounted at `/app/data`.

## Deployment Types

### Remote SurrealDB

- Best for: dedicated database hosts, shared infrastructure, or multi-service deployments.
- App connects over RPC with configured credentials.
- Configure: set `SURREAL_TYPE=remote` and `SURREAL_URL=http://<host>:<port>/rpc`.

### Embedded SurrealDB

- Best for: single-node self-hosting and simpler local deployments.
- App starts SurrealDB via embedded engines inside the server process.
- Configure: set `SURREAL_TYPE=embedded` and `SURREAL_URL=rocksdb://<path-to-db-file>`.

## Project Status

ClassicForum is an active passion project, originally built for personal publishing and community discussion. If this direction resonates with you, star the repository and open issues with feedback or ideas.

## License

ClassicForum is released under the MIT License. See [LICENSE](./LICENSE).

## Philosophy

The internet works best when communities can be independently run, publicly accessible, and not locked behind someone else’s platform decisions. ClassicForum exists to make that path easier.
