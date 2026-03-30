<script setup lang="ts">
import type { Pin, Sortable } from '@@/shared/types'

const cache = useCache()

const pins = await useDatasource<Pin[]>("/api/feed/pinned")

const sortBy = cache.get<string>("feed.sort", () => "new")
const discover = useDatasource<Sortable[]>("/api/feed/discover", {
    query: {
        sortBy: sortBy
    }
})
</script>

<template>
    <section class="feed column g-2 p-4">
        <template v-for="pin in pins.data.value" :key="pin.id">
            <MultiPreview :item="pin.item" />
        </template>
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