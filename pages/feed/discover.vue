<script setup lang="ts">
import type { Sortable, Post } from '~/types'

const cache = useCache()

const sortBy = cache.get<string>("feed.sort", () => "new")
const discover = await useFetch<Sortable[]>("/api/feed/discover", {
    query: {
        sortBy: sortBy
    }
})

const pins = await useFetch<Post[]>("/api/post/pinned")

</script>

<template>
    <section class="feed column g-2 p-4">
        <template v-for="post in pins.data.value" :key="post.id">
            <PostPreview :post="post" :pinned="true" />
        </template>
        <Feed :items="discover" :sorting="true" @refresh="(type) => sortBy = type">
            <template #item="item">
                <MultiPreview :item="item" />
            </template>
        </Feed>
    </section>
</template>

<style scoped lang="scss">
section.feed {
    @include fit-width(60rem, 1rem);
}
</style>