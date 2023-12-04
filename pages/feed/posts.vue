<script setup lang="ts">
import type { Post, User } from '~/types'

const cache = useCache()
const session = getSession()

const posts = await useAsyncData('postFeed', () => {
    return $fetch<Post[]>("/api/post")
})

const pins = await useAsyncData('pinnedPosts', () => {
    return $fetch<Post[]>("/api/post/pinned")
})

const filterType = cache.get("feed.posts.filterType", () => "All")
function toggleFilter() {
    if (session.isAuthenticated) {
        switch (filterType.value) {
            case "All":
                filterType.value = "Feed"
                return
            case "Feed":
                filterType.value = "All";
        }
    }
}

const filteredPosts = computed(() => {
    let filtered = posts.data.value?.filter(f => pins.data.value?.every(p => p.id != f.id)) ?? []
    
    if (filterType.value == "Feed") {
        filtered = filtered.filter(p => {
            return p.topics.some(pt => session.user.topics.includes(pt))
            || session.user.following.includes((p.user as User).id)
        })
    }

    return filtered
})
</script>

<template>
    <section class="feed column g-2 p-4">
        <PostPreview v-for="post in pins.data.value" :post="post" :pinned="true" :key="post.id" />
        <Feed
            :sorting="true"
            :loading="posts.pending.value"
            :items="filteredPosts ?? []"
            @refresh="posts.refresh"
        >
            <template #buttons>
                <button class="dark" @click="toggleFilter">
                    <i class="fa-solid fa-globe"></i>
                    <span>{{ filterType }}</span>
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
    @include fit-width(800px, 1rem);
}
</style>