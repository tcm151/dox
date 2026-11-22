<script setup lang="ts">
import type { Pin, Sortable } from '@@/shared/types'

const cache = useCache()

const pins = await useDatasource<Pin[]>("/api/feed/pinned")

const feedType = cache.get<string>("feed.type", () => "popular")
const feedPage = useFeedDatasource<Sortable>(() => `/api/feed/${feedType.value}`, {
    sorting: true,
})

// TODO switching between feed types doesn't work currently
const feeds = ["popular", "following"]

function toggleFeedType() {
    const index = feeds.findIndex(f => f == feedType.value)
    feedType.value = feeds[index+1] ?? "popular"
}
</script>

<template>
    <section class="content-width feed column g-2 p-4">
        <template v-for="pin in pins.data.value" :key="pin.id">
            <MultiPreview :item="pin.item" pinned />
        </template>
        <Feed :items="feedPage">
            <template #buttons>
                <template v-for="type in feeds">
                    <button v-if="feedType == type" class="dark text capitalize f-1 b-0" @click="toggleFeedType">
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
