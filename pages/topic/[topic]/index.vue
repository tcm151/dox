<script setup lang="ts">
import type { Topic, Sortable } from '~/types'

const cache = useCache()
const route = useRoute()

const id = route.params.topic?.toString()
await useDatasource(`/api/topic/${id}/visit`)
const topic = await useDatasource<Topic>(`/api/topic/${id}`)

const sortBy = cache.get<string>("feed.sort", () => "new")
const feed = useDatasource<Sortable[]>(`/api/topic/${id}/feed`, {
    query: {
        sortBy: sortBy
    }
})
</script>

<template>
    <article v-if="topic.data.value" class="column g-2 p-4">
        <TopicPreview :topic="topic.data.value" @refresh="topic.refresh()" />
        <Feed :items="feed" :sorting="true" @refresh="(type) => sortBy = type">
            <template #item="item">
                <MultiPreview :item="item" />
            </template>
        </Feed>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>