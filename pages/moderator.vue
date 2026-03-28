<script setup lang="ts">
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
        
        const cache = useCache()
        const lastTab = cache.get("moderator.lastTab", () => "topics")
        if (to.path === "/moderator") {
            return navigateTo(`/moderator/${lastTab.value}`)
        }
        else {
            lastTab.value = to.path.split("/").at(-1)!
        }
    }
})

const route = useRoute()

const tabs = [
    { route: '/moderator/topics', icon: 'fa-tags', label: 'Topics' },

]
</script>

<template>
    <article class="moderator column inline">
        <ClientOnly>
            <PagedTabstrip :tabs="tabs" />
        </ClientOnly>
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