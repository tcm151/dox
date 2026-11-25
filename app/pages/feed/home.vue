<script setup lang="ts">
import type { Pin } from '@@/shared/types'

const cache = useCache()

const pins = await useDatasource<Pin[]>("/api/feed/pinned")

const feedType = cache.get<string>("feed.type", () => "popular")
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
        <HomeFeed :key="feedType" :feed-type="feedType">
            <template #buttons>
                <template v-for="type in feeds">
                    <button v-if="feedType == type" class="dark text capitalize f-1 b-0" @click="toggleFeedType">
                        {{ type }}
                    </button>
                </template>
            </template>
        </HomeFeed>
    </section>
</template>
