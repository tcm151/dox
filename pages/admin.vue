<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (!import.meta.client) return
        
        const session = getSession()
        if (to.path.startsWith("/admin")) {
            if (!ENV.isDevelopment() && (!session.isAuthenticated || !hasRole(session.user, "admin"))) {
                return abortNavigation()
            }
        }
        
        const cache = useCache()
        const lastTab = cache.get("admin.lastTab", () => "users")
        if (to.path === "/admin") {
            return navigateTo(`/admin/${lastTab.value}`)
        }
        else {
            lastTab.value = to.path.split("/").at(-1)!
        }
    }
})

const route = useRoute()

const tabs = [
    { route: '/admin/pins', icon: 'fa-solid fa-thumbtack', label: 'Pins' },
    { route: '/admin/users', icon: 'fa-solid fa-user', label: 'Users' },
    { route: '/admin/reports', icon: 'fa-solid fa-flag', label: 'Reports' },
    { route: '/admin/feedback', icon: 'fa-solid fa-comment', label: 'Feedback' },
]
</script>

<template>
    <article class="admin column center-inline">
        <ClientOnly>
            <PagedTabstrip :tabs="tabs" />
        </ClientOnly>
        <section class="page column center-inline">
            <NuxtPage :key="route.path" />
        </section>
    </article>
</template>

<style scoped lang="scss">
article.admin {
    width: stretch;
    overflow-y: hidden;
}

section.page {
    width: stretch;
    height: stretch;
    overflow-y: auto;
}
</style>