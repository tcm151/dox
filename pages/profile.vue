<script setup lang="ts">
definePageMeta({
    middleware: async (to, from) => {
        const hints = useHints()
        const session = getSession()
        if (session.isAuthenticated || await session.authenticate()) {
            if (from.query["confirmation"]) {
                try {
                    await session.useApi("/api/profile/confirm", from.query["confirmation"])
                    await session.fetchProfile()
                    hints.addSuccess("Your account has been confirmed.")
                }
                catch (ex: any) {
                    hints.addError("Unable to confirm your account.")
                }
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