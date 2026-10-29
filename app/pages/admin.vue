<script setup lang="ts">
const route = useRoute()
const settings = useSettings()

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
        
        const tabs = useLastTab({ base: "admin", default: "users" })
        if (to.path === "/admin") {
            return navigateTo(tabs.getLastTab())
        }
        else {
            tabs.setLastTab(to.path)
        }
    }
})

const tabs = ref<TabItem[]>([
    { route: '/admin/pins', icon: 'fa-thumbtack', label: 'Pins' },
    { route: '/admin/users', icon: 'fa-user', label: 'Users' },
    { route: '/admin/feedback', icon: 'fa-comment', label: 'Feedback', hide: () => !settings.app.misc.feedback.enabled },
    { route: '/admin/settings', icon: 'fa-gear', label: 'Settings' },
    { route: '/admin/logs', icon: 'fa-clipboard-list', label: 'Logs' },
])

</script>

<template>
    <article class="admin column inline tabbed-shell">
        <PagedTabstrip :tabs="tabs" />
        <section class="page column inline tabbed-content">
            <NuxtPage :key="route.path" />
        </section>
    </article>
</template>

<style scoped lang="scss">
</style>