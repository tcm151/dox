<script setup lang="ts">

const tabs = ref<TabItem[]>([
    { route: '/settings/profile', icon: 'fa-address-card', label: 'Profile' },
    { route: '/settings/preferences', icon: 'fa-sliders', label: 'Preferences' },
])

definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (!ENV.isClient()) return

        const session = getSession()

        if (to.path.startsWith("/settings") && !session.isAuthenticated) {
            return abortNavigation()
        }
        if (to.path === "/settings") {
            return navigateTo("/settings/profile")
        }
    }
})

// TODO allow for revoking all active account sessions
// TODO allow for deleting/archiving account so a user can remove their presence but keep their content and contributions intact
// TODO add configuration of content preferences, blocked users, topics, keywords, etc
</script>

<template>
    <article class="column inline">
        <PagedTabstrip :tabs="tabs" />
        <section class="page column inline">
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