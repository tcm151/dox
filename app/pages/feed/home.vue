<script setup lang="ts">
import type { Pin, Sortable } from '@@/shared/types'

const cache = useCache()

const pins = await useDatasource<Pin[]>("/api/feed/pinned")

// TODO add paged loading parity with inbox notifications.
const sortBy = cache.get<string>("feed.sort", () => "new")
const selectedFeed = cache.get<string>("feed.type", () => "popular")
const feed = useDatasource<Sortable[]>(() => `/api/feed/${selectedFeed.value}`, {
    query: {
        sortBy: sortBy,
    }
})

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
    </section>
</template>

<style scoped lang="scss">
section.feed {
    @include fit-width(60rem, 1rem);
}
</style>