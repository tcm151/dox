<script setup lang="ts">
import type { Topic } from '~/types'

const { data: topics } = await useFetch<Topic[]>("/api/topic")
</script>

<template>
    <article class="column g-2 p-4">
        <template v-for="topic in topics" :key="topic.id">
            <TopicPreview :topic="topic" />
        </template>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>