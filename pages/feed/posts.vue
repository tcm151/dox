<script setup lang="ts">
import type { Post } from '~/types'

const pins = await useFetch<Post[]>("/api/post/pinned")
const posts = await useFetch<Post[]>("/api/post")
</script>

<template>
    <section class="feed column g-2 p-4">
        <template v-for="post in pins.data.value" :key="post.id">
            <PostPreview :post="post" :pinned="true" />
        </template>
        <Feed :items="posts" :sorting="true">
            <template #item="post">
                <PostPreview :post="post" />
            </template>
        </Feed>
    </section>
</template>

<style scoped lang="scss">
section.feed {
    @include fit-width(60rem, 1rem);
}
</style>