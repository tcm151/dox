<script setup lang="ts">
import type { Topic } from '~/types'

const { data: topics } = await useDatasource<Topic[]>("/api/topic")
</script>

<template>
    <article class="column g-2 p-4 fit-large">
        <template v-if="topics && topics.length > 0">
            <template v-for="topic in topics" :key="topic.id">
                <TopicPreview :topic="topic" />
            </template>
        </template>
        <template v-else>
            <div class="column center box p-4">
                There is nothing here currently.
            </div>
        </template>
    </article>
</template>

<style scoped lang="scss">
article {
}
</style>