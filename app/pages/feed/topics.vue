<script setup lang="ts">
import type { Topic } from '@@/shared/types'

const { data: topics } = await useDatasource<Topic[]>("/api/topic")
</script>

<template>
    <article class="content-width column g-2 p-4">
        <template v-if="topics && topics.length > 0">
            <template v-for="topic in topics" :key="topic.id">
                <TopicPreview :topic="topic" />
            </template>
        </template>
        <template v-else>
            <div class="box empty-state stacked">
                There is nothing here currently.
            </div>
        </template>
    </article>
</template>
