<script setup lang="ts">
import type { Topic, Sortable } from '~/types'

const route = useRoute()
const topicId = route.params.topic?.toString()
const topic = await useFetch<Topic>(`/api/topic/${topicId}`)

const cache = useCache()
const sortBy = cache.get<string>("feed.sort", () => "new")
const feed = await useFetch<Sortable[]>(`/api/topic/${topicId}/feed`, {
    query: {
        sortBy: sortBy
    }
})
</script>

<template>
    <article class="column g-2 p-4" v-if="topic.data.value">
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
    @include fit-width(60rem, 1rem);
}
</style>