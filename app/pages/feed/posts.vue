<script setup lang="ts">
import type { Post } from '@@/shared/types'

const cache = useCache()

const sortBy = cache.get<string>("feed.sort", () => "new")
const posts = useDatasource<Post[]>("/api/post", {
    query: {
        sortBy: sortBy
    }
})
</script>

<template>
    <section class="feed column g-2 p-4">
        <Feed :items="posts" :sorting="true" @refresh="(type) => sortBy = type">
            <template #buttons>
                <button class="dark px-5" @click="navigateTo('/editor/posts')">
                    <i class="fa-solid fa-feather"></i>
                    <span>Submit</span>
                </button>
            </template>
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