<script setup lang="ts">
const route = useRoute()

definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (!ENV.isClient()) return
        
        const session = getSession()
        if (to.path.startsWith("/moderator")) {
            if (!session.isAuthenticated || !hasRole(session.user, "moderator")) {
                return abortNavigation()
            }
        }

        const tabs = useLastTab({ base: "moderator", default: "topics" })
        if (to.path === "/moderator") {
            return navigateTo(tabs.getLastTab())
        }
        else {
            tabs.setLastTab(to.path)
        }
    }
})

const tabs = ref<TabItem[]>([
    { route: '/moderator/topics', icon: 'fa-tags', label: 'Topics' },
    { route: '/moderator/requests', icon: 'fa-bell', label: 'Requests' },
])

</script>

<template>
    <article class="moderator column inline">
        <PagedTabstrip :tabs="tabs" />
        <section class="page column inline">
            <NuxtPage :key="route.path" />
        </section>
    </article>
</template>

<style scoped lang="scss">
article.moderator {
    width: stretch;
    overflow-y: hidden;
}

section.page {
    width: stretch;
    height: stretch;
    overflow-y: auto;
}
</style>