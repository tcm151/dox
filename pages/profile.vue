<script setup lang="ts">
definePageMeta({
    middleware: async (to, from) => {
        const session = getSession()
        if (session.isAuthenticated || await session.authenticate()) {
            if (from.query["confirmation"]) {
                await session.useApi("/api/profile/confirm", from.query["confirmation"])
                await session.fetchProfile()
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