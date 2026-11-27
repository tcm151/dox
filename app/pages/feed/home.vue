<script setup lang="ts">
import type { Pin } from '@@/shared/types'

const cache = useCache()
const session = getSession()

const pins = await useDatasource<Pin[]>("/api/feed/pinned")

const selectedFeed = cache.get<string>("feed.type", () => "popular")
const feedType = computed(() => session.isAuthenticated ? selectedFeed.value : "popular")
const feeds = ["popular", "following", "mutuals"]

function toggleFeedType() {
    if (!session.isAuthenticated) return

    const index = feeds.findIndex(f => f == feedType.value)
    selectedFeed.value = feeds[index + 1] ?? "popular"
}
</script>

<template>
    <section class="content-width feed column g-2 p-4">
        <template v-for="pin in pins.data.value" :key="pin.id">
            <MultiPreview :item="pin.item" pinned />
        </template>
        <HomeFeed :key="feedType" :feed-type="feedType">
            <template #buttons>
                <button class="dark text capitalize f-1 b-0" :disabled="!session.isAuthenticated" @click="toggleFeedType">
                    {{ feedType }}
                </button>
            </template>
        </HomeFeed>
    </section>
</template>
