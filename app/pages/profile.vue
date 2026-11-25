<script setup lang="ts">
definePageMeta({
    middleware: async (to, from) => {
        const hints = useHints()
        const session = getSession()
        if (from.query["confirmation"]) {
            await useApi("/api/profile/confirm", {
                body: {
                    id: from.query["confirmation"]
                }
            })
            hints.addSuccess("Your account has been confirmed.")
            return navigateTo("/feed")
        }

        if (to.path.startsWith("/profile")) {
            if (!session.isAuthenticated) {
                return abortNavigation()
            }
        }
        
        const tabs = useLastTab({ base: "profile", default: "account" })
        if (to.path === "/profile") {
            // return navigateTo(tabs.getLastTab())
            await session.refreshProfile()
            return navigateTo(`/user/${extractId(session.user.id)}`)
        }
        else {
            tabs.setLastTab(to.path)
        }
    }
})

// definePageMeta({
//     layout: 'simple',
//     middleware: (to, from) => {
//         if (!ENV.isClient()) return

//         const session = getSession()

//         if (to.path.startsWith("/profile") && !session.isAuthenticated) {
//             return abortNavigation()
//         }
//         if (to.path === "/profile") {
//             return navigateTo("/profile/account")
//         }
//     }
// })

const tabs = ref<TabItem[]>([
    { route: `/profile`, icon: 'fa-arrow-left', label: 'Back' },
    { route: '/profile/account', icon: 'fa-address-card', label: 'Account' },
    { route: '/profile/preferences', icon: 'fa-gear', label: 'Preferences' },
    { route: '/profile/filters', icon: 'fa-eye-slash', label: 'Filters' },
    { route: '/profile/misc', icon: 'fa-ellipsis', label: 'Misc' },
])
</script>

<template>
    <article class="admin column inline tabbed-shell">
        <PagedTabstrip v-adaptive class="wide" :tabs="tabs" />
        <section class="page column inline">
            <NuxtPage />
        </section>
    </article>
</template>

<style scoped lang="scss">
section.page {
    width: 100%;
    overflow-y: auto;
}
</style>