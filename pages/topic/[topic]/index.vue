<script setup lang="ts">
import type { Topic, Sortable } from '~/types'

const cache = useCache()
const route = useRoute()

const id = route.params.topic?.toString()
const topic = await useDatasource<Topic>(`/api/topic/${id}`)

const sortBy = cache.get<string>("feed.sort", () => "new")
const feed = useDatasource<Sortable[]>(`/api/topic/${id}/feed`, {
    query: {
        sortBy: sortBy
    }
})
</script>

<template>
    <article class="column g-2 p-4 fit-large" v-if="topic.data.value">
        <TopicPreview :topic="topic.data.value" />
        <Feed :items="feed" :sorting="true" @refresh="(type) => sortBy = type">
            <template #item="item">
                <MultiPreview :item="item" />
            </template>
        </Feed>
    </article>
</template>

<style scoped lang="scss">
article {
}
</style>