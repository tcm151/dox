<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (process.client) {
            const session = getSession()
            if (to.path.startsWith("/developer") && (!session.isAuthenticated || session.user.id != 'user:opkdyfig54tdre96jc37')) {
                return abortNavigation()
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
                { route: '/developer/tabs', icon: 'fa-solid fa-tags', label: 'Tabs' },
                { route: '/developer/grid', icon: 'fa-solid fa-table-list', label: 'Grid' },
                { route: '/developer/animations', icon: 'fa-solid fa-truck-fast', label: 'Animations' },
                { route: '/developer/misc', icon: 'fa-solid fa-dice-d20', label: 'Misc' },
            ]"
        />
        <NuxtPage />
    </article>
</template>

<style scoped lang="scss">
article {
    width: 100%;
    overflow-y: hidden;
}
</style>