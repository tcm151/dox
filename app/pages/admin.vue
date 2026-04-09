<script setup lang="ts">
const route = useRoute()
const settings = useSettings()

const tabs = useTabRoute({
    key: "admin.lastTab",
    routePath: "/admin",
    defaultTab: "users",
    startingRoutes: [
        { route: '/admin/pins', icon: 'fa-thumbtack', label: 'Pins' },
        { route: '/admin/users', icon: 'fa-user', label: 'Users' },
        { route: '/admin/reports', icon: 'fa-flag', label: 'Reports' },
        { route: '/admin/feedback', icon: 'fa-comment', label: 'Feedback', hide: () => !settings.app.misc.feedback.enabled },
        { route: '/admin/settings', icon: 'fa-gear', label: 'Settings' },
    ],
})

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
        
        if (to.path === "/admin") {
            return navigateTo(tabs.getLastTab())
        }
        else {
            tabs.setLastTab(to.path)
        }
    }
})

// TODO add shadow quarantine queue for suspicious first-time users with limited visibility and interaction
</script>

<template>
    <article class="admin column inline">
        <ClientOnly>
            <PagedTabstrip :tabs="tabs.routes" />
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