<script setup lang="ts">
const route = useRoute()
const settings = useSettings()

const tabs = useTabRoute({
    key: "feed.lastTab",
    routePath: "/feed",
    defaultTab: "discover",
    startingRoutes: [
        { route: '/feed/search', icon: 'fa-magnifying-glass', label: 'Search', hide: () => !settings.app.feeds.search },
        { route: '/feed/discover', icon: 'fa-house', label: 'Home' },
        { route: '/feed/topics', icon: 'fa-tags', label: 'Topics', hide: () => !settings.app.feeds.topics },
        { route: '/feed/posts', icon: 'fa-newspaper', label: 'Posts' },
        { route: '/feed/threads', icon: 'fa-comments', label: 'Threads', hide: () => !settings.app.feeds.threads },
        { route: '/feed/images', icon: 'fa-image', label: 'Images', hide: () => !settings.app.feeds.images },
        { route: '/feed/audio', icon: 'fa-microphone', label: 'Audio', hide: ()=> true },
    ],
})

definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (to.path === "/feed") {
            return navigateTo(tabs.getLastTab())
        }
        else {
            tabs.setLastTab(to.path)
        }
    }
})

// TODO create follow feed based on users/topics that the user follows
// TODO create user customizable feeds with filtering and sorting options, and allow users to save and share their custom feeds
</script>

<template>
    <article class="feed column inline">
        <ClientOnly>
            <PagedTabstrip :tabs="tabs.routes" />
        </ClientOnly>
        <section class="page column inline">
            <NuxtPage :key="route.path" />
        </section>
    </article>
</template>

<style scoped lang="scss">
article.feed {
    width: 100%;
    overflow-y: hidden;
}

section.page {
    width: 100%;
    overflow-y: auto;
}
</style>