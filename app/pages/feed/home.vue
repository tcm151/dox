<script setup lang="ts">
import type { FeedPage, Pin, Sortable } from '@@/shared/types'

const cache = useCache()

const pins = await useDatasource<Pin[]>("/api/feed/pinned")

const pageSize = 20
const sortBy = cache.get<string>("feed.sort", () => "new")
const selectedFeed = cache.get<string>("feed.type", () => "popular")
const feedPage = await useDatasource<FeedPage<Sortable>>(() => `/api/feed/${selectedFeed.value}`, {
    query: {
        sortBy: sortBy,
        pageSize,
        offset: 0,
    }
})

const feed = {
    data: computed(() => feedPage.data.value?.items),
    status: feedPage.status,
    refresh: feedPage.refresh,
}

watch([selectedFeed, sortBy], () => {
    feedPage.data.value = undefined
})

const loading = ref(false)
async function loadMore() {
    const currentPage = feedPage.data.value
    if (!currentPage?.more || loading.value) return

    const requestedFeed = selectedFeed.value
    const requestedSort = sortBy.value
    const requestedOffset = currentPage.offset + pageSize
    loading.value = true
    try {
        const page = await $fetch<FeedPage<Sortable>>(`/api/feed/${requestedFeed}`, {
            headers: { Authorization: getSession().tokens.access },
            query: { sortBy: requestedSort, pageSize, offset: requestedOffset },
        })

        if ( requestedFeed !== selectedFeed.value || requestedSort !== sortBy.value || currentPage !== feedPage.data.value) return

        feedPage.data.value = {
            ...page,
            items: [...currentPage.items, ...page.items],
        }
    }
    finally {
        loading.value = false
    }
}

const feeds = ["popular", "following"]
function cycleFeed() {
    const index = feeds.findIndex(f => f == selectedFeed.value)
    selectedFeed.value = feeds[index+1] ?? "popular"
}
</script>

<template>
    <section class="feed column g-2 p-4">
        <template v-for="pin in pins.data.value" :key="pin.id">
            <MultiPreview :item="pin.item" />
        </template>
        <Feed :items="feed" :sorting="true" @refresh="(type) => sortBy = type">
            <template #buttons>
                <template v-for="type in feeds">
                    <button v-if="selectedFeed == type" class="dark text capitalize" @click="cycleFeed">
                        {{ type }}
                    </button>
                </template>
            </template>
            <template #item="item">
                <MultiPreview :item="item" />
            </template>
        </Feed>
        <button v-if="feedPage.data.value?.more" class="link" :disabled="loading || feedPage.status.value === 'pending'" @click="loadMore">
            <i class="fa-solid fa-angles-down"></i>
            {{ loading ? 'Loading...' : 'Load More' }}
        </button>
    </section>
</template>

<style scoped lang="scss">
section.feed {
    @include fit-width(60rem, 1rem);
}
</style>