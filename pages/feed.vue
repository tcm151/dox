<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        const cache = useCache()
        const lastTab = cache.get("feed.lastTab", () => "posts")
        if (to.path === "/feed") {
            return navigateTo(`/feed/${lastTab.value}`)
        }
        else {
            lastTab.value = to.path.split("/").at(-1)!
        }
    }
})

const route = useRoute()
const settings = useSettings()

const tabs = ref<any[]>([
    { route: '/feed/search', icon: 'fa-solid fa-magnifying-glass', label: 'Search', hide: () => !settings.app.feed.showSearch },
    { route: '/feed/discover', icon: 'fa-solid fa-newspaper', label: 'Discover' },
    { route: '/feed/posts', icon: 'fa-solid fa-newspaper', label: 'Posts' },
    { route: '/feed/threads', icon: 'fa-solid fa-comments', label: 'Threads', hide: () => !settings.app.feed.showThreads },
    { route: '/feed/images', icon: 'fa-solid fa-image', label: 'Images', hide: () => !settings.app.feed.showImages },
    { route: '/feed/audio', icon: 'fa-solid fa-microphone', label: 'Audio', hide: ()=> true },
    { route: '/feed/topics', icon: 'fa-solid fa-tags', label: 'Topics', hide: () => !settings.app.feed.showTopics },
])
</script>

<template>
    <article class="feed column center-inline">
        <ClientOnly>
            <PagedTabstrip :tabs="tabs" />
        </ClientOnly>
        <section class="page column center-inline">
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