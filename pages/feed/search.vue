<script setup lang="ts">
import type { Post, Thread } from '~/types'

const cache = useCache()

const text = cache.get<string>("search.text", () => "")
const posts = await useFetch<(Post | Thread)[]>("/api/feed/search", {
    query: { text },
    watch: false,
})

const [showFilters, toggle] = useToggle(false)
const loading = computed(() => posts.status.value.toString() == "pending")
</script>

<template>
    <section class="feed column g-2 p-4">
        <header class="box column g-2 p-2">
            <div class="field row g-2">
                <ButtonSpinner class="link" :loading="loading" @click="posts.refresh()">
                    <i class="fa-solid fa-magnifying-glass" />
                </ButtonSpinner>
                <input class="f-1" type="search" placeholder="Search..." v-model="text" @keyup.enter="posts.refresh()">
                <!-- TODO add more advanced search options -->
                <!-- <button class="link">
                    <i class="fa-solid fa-filter" @click="toggle()" />
                </button> -->
            </div>
            <div v-if="showFilters" class="field row g-2">
                <input class="f-1" type="search" placeholder="Search...">
            </div>
        </header>
        <Feed :items="posts">
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