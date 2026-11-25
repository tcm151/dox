<script setup lang="ts">
import { feedSettingsByRoute } from "../utils/feedSettings"

const route = useRoute()
const settings = useSettings()

definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (!ENV.isClient()) return

        const settings = useSettings()
        const tabs = useLastTab({ base: "feed", default: "home" })
        if (to.path === "/feed") {
            const lastTab = tabs.getLastTab()
            const lastTabSetting = feedSettingsByRoute[lastTab]
            if (lastTabSetting && settings.app.feeds[lastTabSetting]) {
                return navigateTo(lastTab)
            }

            const firstAvailable = Object.entries(feedSettingsByRoute)
                .find(([, setting]) => setting && settings.app.feeds[setting])?.[0]
            if (firstAvailable) return navigateTo(firstAvailable)

            return abortNavigation(createError({ statusCode: 404, statusMessage: "Feed is not available." }))
        }
        else {
            tabs.setLastTab(to.path)
        }
    }
})

const tabs = ref<TabItem[]>([
    { route: '/feed/search', icon: 'fa-magnifying-glass', label: 'Search', hide: () => !settings.app.feeds.search },
    { route: '/feed/topics', icon: 'fa-tags', label: 'Topics', hide: () => !settings.app.feeds.topics },
    { route: '/feed/home', icon: 'fa-house', label: 'Home', hide: () => !settings.app.feeds.discover },
    { route: '/feed/posts', icon: 'fa-newspaper', label: 'Posts', hide: () => !settings.app.feeds.posts },
    { route: '/feed/links', icon: 'fa-link', label: 'Links', hide: () => !settings.app.feeds.links },
    { route: '/feed/threads', icon: 'fa-comments', label: 'Threads', hide: () => !settings.app.feeds.threads },
    { route: '/feed/gallery', icon: 'fa-images', label: 'Galleries', hide: () => !settings.app.feeds.images },
    { route: '/feed/audio', icon: 'fa-microphone', label: 'Audio', hide: () => !settings.app.feeds.audio },
])

</script>

<template>
    <article class="admin column inline tabbed-shell">
        <PagedTabstrip v-adaptive class="wide" :tabs="tabs" />
        <section v-scroll-position="route.fullPath" class="page column inline">
            <NuxtPage :key="route.path" />
        </section>
    </article>
</template>

<style scoped lang="scss">
section.page {
    width: 100%;
    overflow-y: auto;
}
</style>