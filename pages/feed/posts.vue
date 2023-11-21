<script setup lang="ts">
import type { Post, User } from '~/types'

definePageMeta({
    // layout: 'default'
})

const cache = useCache()
const session = getSession()

let queryParameters = ref({
    pageNumber: 1,
    pageSize: 256,
})

const feed = useFeed(queryParameters.value)
const { data: pins, refresh: refreshPins } = await useAsyncData('activePins', () => {
    return $fetch<Post[]>("/api/post/pinned")
})

onMounted(async () => {
    await feed.fetch()
    await refreshPins()
})

const feedPosts = computed(() => {
    return feed.items!.filter(p =>
        p.topics.some(pt => session.user?.topics.includes(pt))
        || session.user?.following.includes((p.user as User).id)
    )
})
const filteredPosts = computed(() =>  {
    const filtered = filterType.value == "All"
        ? feed.items
        : feedPosts.value

    if (pins.value && pins.value.length > 0) {
        return filtered?.filter(f => pins.value?.some(p => p.id != f.id))
    }
    else {
        return filtered
    }
})

async function goToPage(pageNumber: number) {
    queryParameters.value.pageNumber = Math.max(1, pageNumber)
    await feed.fetch()
}

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
</script>

<template>
    <section class="feed column g-2 p-4">
        <PostPreview :post="post" :pinned="true" v-for="post in pins" :key="post.id" />
        <Feed
            :page="queryParameters.pageNumber"
            :sorting="true"
            :pagination="false"
            @page="goToPage"
            @refresh="feed.fetch"
            :loading="feed.loading"
            :posts="filteredPosts ?? []"
        >
            <template #header>
                <button class="filter-type " @click="toggleFilter">
                    <i class="fa-solid fa-globe"></i>
                    <span>{{ filterType }}</span>
                </button>
            </template>
        </Feed>
    </section>
</template>

<style scoped lang="scss">
section.feed {
    @include fit-width(800px, 1rem);
}

.filter-type {
    flex: 1 1;
    color: $dox-white-2;
    background-color: $dox-black-0;
}

.filter-type:hover {
    background-color: $dox-black-2;
}
</style>