<script setup lang="ts">
const content = `
# OpenForum

Own your community. Host it yourself. Shape it your way.

OpenForum is a self-hosted, modern forum platform for people who want an alternative to closed platforms like Discord, heavily centralized networks like Reddit, and aging forum software stacks. It is designed for public communities, niche interests, and creators who want full control over how their space looks, works, and grows.

## Why OpenForum?

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

## Who It's For

- Community builders leaving closed chat-first platforms.
- Independent creators who want a public, searchable home for their content.
- Teams and hobby groups that want a classic forum feel with a modern stack.
- Self-hosters who prefer owning their data, uptime, and roadmap.

## Project Status

OpenForum is an active passion project, originally built for personal publishing and community discussion. If this direction resonates with you, star the repository and open issues with feedback or ideas.

## Philosophy

The internet works best when communities can be independently run, publicly accessible, and not locked behind someone else’s platform decisions. OpenForum exists to make that path easier.
`
</script>

<template>
    <article class="m-4">
        <div class="box px-5 py-2">
            <Markdown class="content" :content="content" />
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width (60rem, 1rem);
}
</style>