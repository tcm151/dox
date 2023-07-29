<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (process.client) {
            const session = getSession()
            if (to.path.includes("/reset-password")) {
                return
            }
            if (to.path.startsWith("/settings") && !session.isAuthenticated) {
                return abortNavigation()
            }
            if (to.path === "/settings") {
                return navigateTo("/settings/profile")
            }
        }
    }
})
</script>

<template>
    <article class="column center-inline">
        <PagedTabstrip
            :tabs="[
                { route: '/settings/profile', icon: 'fa-solid fa-address-card', label: 'Profile' },
                // { route: '/settings/account', icon: 'fa-solid fa-address-card', label: 'Account' },
                { route: '/settings/preferences', icon: 'fa-solid fa-sliders', label: 'Preferences' },
            ]"
        />
        <section class="page column center-inline">
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