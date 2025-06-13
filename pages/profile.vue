<script setup lang="ts">
definePageMeta({
    middleware: async (to, from) => {
        const hints = useHints()
        const session = getSession()
        if (from.query["confirmation"]) {
            await session.useApi("/api/profile/confirm", {
                id: from.query["confirmation"]
            })
            hints.addSuccess("Your account has been confirmed.")
            return navigateTo("/feed")
        }
        if (session.isAuthenticated) {
            await session.fetchProfile()
            return navigateTo(`/user/${extractId(session.user.id)}`)
        }
    }
})
</script>


<template>
</template>

<style scoped lang="scss">
</style>