<script setup lang="ts">
const route = useRoute()
const settings = useSettings()

definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (!ENV.isClient()) return

        const tabs = useLastTab({ base: "feed", default: "home" })
        if (to.path === "/feed") {
            return navigateTo(tabs.getLastTab())
        }
        else {
            tabs.setLastTab(to.path)
        }
    }
})

const tabs = ref<TabItem[]>([
    { route: '/feed/search', icon: 'fa-magnifying-glass', label: 'Search', hide: () => !settings.app.feeds.search },
    { route: '/feed/home', icon: 'fa-house', label: 'Home' },
    { route: '/feed/topics', icon: 'fa-tags', label: 'Topics', hide: () => !settings.app.feeds.topics },
    { route: '/feed/posts', icon: 'fa-newspaper', label: 'Posts', hide: () => !settings.app.feeds.posts },
    { route: '/feed/threads', icon: 'fa-comments', label: 'Threads', hide: () => !settings.app.feeds.threads },
    { route: '/feed/images', icon: 'fa-image', label: 'Images', hide: () => !settings.app.feeds.images },
    { route: '/feed/audio', icon: 'fa-microphone', label: 'Audio', hide: () => !settings.app.feeds.audio },
])

</script>

<template>
    <article class="feed column inline">
        <PagedTabstrip :tabs="tabs" />
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