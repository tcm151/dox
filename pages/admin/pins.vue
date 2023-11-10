<script setup lang="ts">

const session = getSession()

const { data: pins, pending, refresh } = useAsyncData('pins', () => {
    return session.useApi<any[]>("/api/admin/pin")
})

const pinnedPosts = computed(() => {
    return pins.value?.map(p => p.post)
})

</script>

<template>
    <article class="column p-4">
        <Feed
            :pagination="false"
            @refresh="refresh"
            :loading="pending"
            :posts="pinnedPosts ?? []"
        >
        </Feed>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}
</style>