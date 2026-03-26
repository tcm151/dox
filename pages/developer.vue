<script setup lang="ts">
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

        const cache = useCache()
        const lastTab = cache.get("developer.lastTab", () => "query")
        if (to.path === "/developer") {
            return navigateTo(`/developer/${lastTab.value}`)
        }
        else {
            lastTab.value = to.path.split("/").at(-1)!
        }
    }
})

const route = useRoute()

const tabs = ref<any[]>([
    { route: '/developer/schema', icon: 'fa-solid fa-table-columns', label: 'Schema' },
    { route: '/developer/query', icon: 'fa-solid fa-terminal', label: 'Database' },
    { route: '/developer/errors', icon: 'fa-solid fa-circle-exclamation', label: 'Errors' },
])
</script>

<template>
    <article class="developer column inline">
        <ClientOnly>
            <PagedTabstrip :tabs="tabs" />
        </ClientOnly>
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