<script setup lang="ts">
import { Post } from '~/types'

definePageMeta({
    layout: 'default'
})

const session = getSession()

let queryParameters = ref({
    pageNumber: 1,
    pageSize: 12,
})

const feed = useFeed(queryParameters.value)

const feedPosts = computed(() => {
    return feed.items!.filter(p =>
        p.topics.some(pt => session.user?.topics.includes(pt))
        || session.user?.following.includes(p.user.id)
    )
})
const filteredPosts = computed(() =>  {
    return filterType.value == "All"
        ? feed.items
        : feedPosts.value
})

async function goToPage(pageNumber: number) {
    queryParameters.value.pageNumber = Math.max(1, pageNumber)
    await feed.fetch()
}

let filterType = ref("All")

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
    <section class="feed p-4">
        <Feed
        :page="queryParameters.pageNumber"
        :sorting="true"
        :pagination="true"
        @page="goToPage"
        @refresh="feed.fetch"
        :posts="filteredPosts ?? []">
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
    color: $dox-white;
    background-color: $dox-black;
}

.filter-type:hover {
    background-color: $dox-grey-dark;
}
</style>