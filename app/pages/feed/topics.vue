<script setup lang="ts">
import type { Topic } from '@@/shared/types'

const { data: topics, refresh } = await useDatasource<Topic[]>("/api/feed/topics")
</script>

<template>
    <article class="content-width column g-2 p-4">
        <template v-if="topics && topics.length > 0">
            <template v-for="topic in topics" :key="topic.id">
                <TopicPreview :topic="topic" @refresh="refresh()" />
            </template>
        </template>
        <template v-else>
            <div class="box empty-state stacked">
                There is nothing here currently.
            </div>
        </template>
    </article>
</template>

<!-- TODO setup topics as feed -->
<!-- <script setup lang="ts">
import type { Topic } from '@@/shared/types'

const topics = useFeedDatasource<Topic>("/api/feed/topics", {
    sorting: true,
})
</script>

<template>
    <section class="content-width feed column g-2 p-4">
        <Feed :items="topics">
            <template #item="topic">
                <TopicPreview :topic="topic" />
            </template>
        </Feed>
    </section>
</template> -->

