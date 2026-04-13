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
    { route: '/admin/reports', icon: 'fa-flag', label: 'Reports' },
    { route: '/admin/feedback', icon: 'fa-comment', label: 'Feedback', hide: () => !settings.app.misc.feedback.enabled },
    { route: '/admin/settings', icon: 'fa-gear', label: 'Settings' },
])

</script>

<template>
    <article class="admin column inline">
        <PagedTabstrip :tabs="tabs" />
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