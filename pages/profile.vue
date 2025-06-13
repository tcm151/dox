<script setup lang="ts">
definePageMeta({
    middleware: async (to, from) => {
        const hints = useHints()
        const session = getSession()
        if (session.isAuthenticated || await session.authenticate()) {
            hints.addError("This is currently non-functional.")
            // if (from.query["confirmation"]) {
            //     await session.useApi("/api/profile/confirm", {
            //         id: from.query["confirmation"]
            //     })
            //     hints.addSuccess("Your account has been confirmed.")
            // }
            // await session.fetchProfile()
            // return navigateTo(`/user/${extractId(session.user.id)}`)
        }
    }
})
</script>


<template>
</template>

<style scoped lang="scss">
</style>