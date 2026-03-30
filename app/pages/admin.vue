<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (!ENV.isClient()) return
        
        const session = getSession()
        if (to.path.startsWith("/admin")) {
            if (!session.isAuthenticated || !hasRole(session.user, "admin")) {
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
const settings = useSettings()

const tabs = [
    { route: '/admin/pins', icon: 'fa-thumbtack', label: 'Pins' },
    { route: '/admin/users', icon: 'fa-user', label: 'Users' },
    { route: '/admin/reports', icon: 'fa-flag', label: 'Reports' },
    { route: '/admin/feedback', icon: 'fa-comment', label: 'Feedback', hide: () => !settings.app.misc.feedback.enabled },
    { route: '/admin/settings', icon: 'fa-gear', label: 'Settings' },
]
</script>

<template>
    <article class="admin column inline">
        <ClientOnly>
            <PagedTabstrip :tabs="tabs" />
        </ClientOnly>
        <section class="page column inline">
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