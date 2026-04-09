<script setup lang="ts">
const route = useRoute()

const tabs = useTabRoute({
    key: "moderator.lastTab",
    routePath: "/moderator",
    defaultTab: "topics",
    startingRoutes: [
        { route: '/moderator/topics', icon: 'fa-tags', label: 'Topics' },
        { route: '/moderator/requests', icon: 'fa-bell', label: 'Requests' },
    ],
})

definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (!ENV.isClient()) return
        
        const session = getSession()
        if (to.path.startsWith("/moderator")) {
            if (!session.isAuthenticated || !hasRole(session.user, "moderator")) {
                return abortNavigation()
            }
        }
        
        if (to.path === "/moderator") {
            return navigateTo(tabs.getLastTab())
        }
        else {
            tabs.setLastTab(to.path)
        }
    }
})

// TODO add moderator action logging and audit trail for accountability, with details on the moderator, action taken, and timestamp.
// TODO add appeal workflow for moderated content with status tracking and communication between moderators and users, and display appeal status on the relevant content.
</script>

<template>
    <article class="moderator column inline">
        <ClientOnly>
            <PagedTabstrip :tabs="tabs.routes" />
        </ClientOnly>
        <section class="page column inline">
            <NuxtPage :key="route.path" />
        </section>
    </article>
</template>

<style scoped lang="scss">
article.moderator {
    width: stretch;
    overflow-y: hidden;
}

section.page {
    width: stretch;
    height: stretch;
    overflow-y: auto;
}
</style>