<script setup lang="ts">
definePageMeta({
    middleware: async (to, from) => {
        const session = getSession()
        if (session.isAuthenticated || await session.authenticate()) {
            if (from.query["confirmation"]) {
                session.user.confirmed = await session.useApi("/api/profile/confirm", from.query["confirmation"]) ?? session.user.confirmed
            }
            if (from.query["report"]) {
                // alert("REPORT!")
            }
            return navigateTo(`/user/${extractId(session.user.id)}`)
        }
    }
})
</script>


<template>
</template>

<style scoped lang="scss">
</style>