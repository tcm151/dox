<script setup lang="ts">
import type { Pin, Sortable } from '@@/shared/types'

const cache = useCache()

const pins = await useDatasource<Pin[]>("/api/feed/pinned")

const sortBy = cache.get<string>("feed.sort", () => "new")
const selectedFeed = cache.get<string>("feed.type", () => "discover")
const discover = useDatasource<Sortable[]>(`/api/feed/${selectedFeed.value}`, {
    query: {
        type: selectedFeed,
        sortBy: sortBy,
    }
})

const feeds = ["discover", "following"]
function cycleFeed() {
    const index = feeds.findIndex(f => f == selectedFeed.value)
    selectedFeed.value = feeds[index] ?? "discover"
}
</script>

<template>
    <section class="feed column g-2 p-4">
        <template v-for="pin in pins.data.value" :key="pin.id">
            <MultiPreview :item="pin.item" />
        </template>
        <header class="row g-2">
            <template v-for="type in feeds">
                <button class="dark text capitalize" @click="cycleFeed">
                    {{ type }}
                </button>
            </template>
        </header>
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