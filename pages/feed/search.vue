<script setup lang="ts">
import type { Sortable } from '~/types'

const cache = useCache()

const text = cache.get<string>("search.text", () => "")
const feed = useDatasource<Sortable[]>("/api/feed/search", {
    watch: false,
    query: {
        text: text
    },
})

const [showFilters, toggle] = useToggle(false)
const loading = computed(() => feed.status.value.toString() == "pending")
</script>

<template>
    <section class="feed column g-2 p-4">
        <header class="box column g-2 p-2">
            <div class="field row g-2">
                <ButtonSpinner class="link" :loading="loading" @click="feed.refresh()">
                    <i class="fa-solid fa-magnifying-glass" />
                </ButtonSpinner>
                <input class="f-1" type="search" placeholder="Search..." v-model="text" @keyup.enter="feed.refresh()">
                <!-- TODO add more advanced search options -->
                <!-- <button class="link">
                    <i class="fa-solid fa-filter" @click="toggle()" />
                </button> -->
            </div>
            <div v-if="showFilters" class="field row g-2">
                <input class="f-1" type="search" placeholder="Search...">
            </div>
        </header>
        <Feed :items="feed">
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