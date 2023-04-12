<script setup lang="ts">
import { Post } from '~/types'

definePageMeta({
    layout: 'default'
})

const session = getSession()

let query = {
    pageNumber: 1,
    pageSize: 5,
}

const feed = useFeed(query)

const feedPosts = computed(() => {
    return feed.items!.filter(p =>
        p.topics.some(pt => session.user?.topics.includes(pt))
        || session.user?.following.includes(p.user.id)
    )
})

async function goToPage(pageNumber: number) {
    query.pageNumber = pageNumber
    await feed.fetch()
}

let filterType = ref("All")
let filteredPosts = ref<Post[] | null>([])

onMounted(() => filteredPosts.value = feed.items)

function toggleFilter() {
    switch (filterType.value) {
        case "All":
            filterType.value = "Feed";
            filteredPosts.value = feedPosts.value;
            return;
        case "Feed":
            filterType.value = "All";
            filteredPosts.value = feed.items;
            return;
    }
}
</script>

<template>
    <section class="feed p-4">
        <Feed
        :page="query.pageNumber"
        :sorting="true"
        :pagination="true"
        @page="goToPage"
        @refresh="feed.fetch"
        :posts="feed.items ?? []">
            <template #header>
                <button class="filter-type" @click="toggleFilter">
                    <i class="fa-solid fa-globe"></i>
                    <span>{{ filterType }}</span>
                </button>
            </template>
        </Feed>
    </section>
</template>

<style scoped lang="scss">
.feed {
    @include fit-width(800px, 1rem);
}

.filter-type {
    flex: 1 1;
    @include flex-h (0.5rem);
    justify-content: center;
    align-items: center;
    color: $dox-white;
    background-color: $dox-black;
}

.filter-type:hover {
    background-color: $dox-grey-dark;
}
</style>