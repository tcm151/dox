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
    }
})
</script>