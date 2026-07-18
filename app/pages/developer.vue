<script setup lang="ts">
const route = useRoute()

definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (!ENV.isClient()) return
            
        const session = getSession()
        if (to.path.startsWith("/developer")) {
            if (!session.isAuthenticated || !hasRole(session.user, "developer")) {
                return abortNavigation()
            }
        }

        const tabs = useLastTab({ base: "developer", default: "query" })
        if (to.path === "/developer") {
            return navigateTo(tabs.getLastTab())
        }
        else {
            tabs.setLastTab(to.path)
        }
    }
})

const tabs = ref<TabItem[]>([
    { route: '/developer/info', icon: 'fa-list', label: 'Info' },
    { route: '/developer/schema', icon: 'fa-table-columns', label: 'Schema' },
    { route: '/developer/query', icon: 'fa-terminal', label: 'Database' },
    { route: '/developer/errors', icon: 'fa-triangle-exclamation', label: 'Errors' },
])
</script>

<template>
    <article class="developer column inline">
        <PagedTabstrip :tabs="tabs" />
        <section class="page column inline">
            <NuxtPage :key="route.path" />
        </section>
    </article>
</template>

<style scoped lang="scss">
article.developer {
    width: stretch;
    overflow-y: hidden;
}

section.page {
    width: stretch;
    height: stretch;
    overflow-y: auto;
}
</style>