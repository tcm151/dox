<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (process.client) {
            const session = getSession()
            if (to.path.startsWith("/developer") && (!session.isAuthenticated || hasRole(session.user, "developer"))) {
                if (!ENV.isDevelopment) {
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
    }
})
</script>

<template>
    <article class="column center-inline">
        <PagedTabstrip
            :tabs="[
                { route: '/developer/schema', icon: 'fa-solid fa-table-columns', label: 'Schema' },
                { route: '/developer/query', icon: 'fa-solid fa-terminal', label: 'Database' },
                // { route: '/developer/grid', icon: 'fa-solid fa-table-list', label: 'Grid' },
                { route: '/developer/backups', icon: 'fa-solid fa-warehouse', label: 'Backups' },
                { route: '/developer/config', icon: 'fa-solid fa-gear', label: 'Config' },

            ]"
        />
        <section class="page column center-inline">
            <NuxtPage />
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    width: 100%;
    overflow-y: hidden;
}

section.page {
    width: 100%;
    overflow-y: auto;
}
</style>