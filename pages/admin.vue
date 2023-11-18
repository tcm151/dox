<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (process.client) {
            const session = getSession()
            if (to.path.startsWith("/admin") && (!session.isAuthenticated && !session.user.admin)) {
                return abortNavigation()
            }
            if (to.path === "/admin") {
                return navigateTo("/admin/feedback")
            }
        }
    }
})
</script>

<template>
    <article class="column center-inline">
        <PagedTabstrip
            :tabs="[
                { route: '/admin/pins', icon: 'fa-solid fa-thumbtack', label: 'Pins' },
                { route: '/admin/feedback', icon: 'fa-solid fa-message', label: 'Feedback' },
                { route: '/admin/reports', icon: 'fa-solid fa-flag', label: 'Reports' },
                { route: '/admin/backups', icon: 'fa-solid fa-warehouse', label: 'Backups' },
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