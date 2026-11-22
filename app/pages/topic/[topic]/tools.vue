<script setup lang="ts">
const route = useRoute()

definePageMeta({
    layout: 'simple',
    middleware: (to) => {
        if (!ENV.isClient()) return

        const session = getSession()
        if (!session.isAuthenticated || (!hasRole(session.user, "moderator") && !hasRole(session.user, "admin"))) {
            return abortNavigation()
        }

        const topicId = to.params.topic?.toString()
        const toolsRoute = `/topic/${topicId}/tools`
        if (to.path === toolsRoute) {
            return navigateTo(`${toolsRoute}/profile`)
        }
    }
})

const tabs = computed<TabItem[]>(() => {
    const id = route.params.topic?.toString()
    if (!id) return []

    return [
        { route: `/topic/${id}`, icon: 'fa-arrow-left', label: 'Back' },
        { route: `/topic/${id}/tools/profile`, icon: 'fa-address-card', label: 'Profile' },
        { route: `/topic/${id}/tools/moderators`, icon: 'fa-users', label: 'Moderators' },
        { route: `/topic/${id}/tools/pins`, icon: 'fa-thumbtack', label: 'Pins' },
        { route: `/topic/${id}/tools/reports`, icon: 'fa-flag', label: 'Reports' },
    ]
})
</script>

<template>
    <article class="topic-tools column inline tabbed-shell">
        <PagedTabstrip class="medium" :tabs="tabs" />
        <section class="page column inline tabbed-content">
            <NuxtPage :key="route.path" />
        </section>
    </article>
</template>
