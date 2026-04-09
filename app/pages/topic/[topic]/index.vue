<script setup lang="ts">
import type { Topic, Sortable } from '@@/shared/types'

const cache = useCache()
const route = useRoute()

const id = route.params.topic?.toString()
await useDatasource(`/api/topic/${id}/visit`)
const topic = await useDatasource<Topic>(`/api/topic/${id}`)
const related = await useDatasource<{ id: string, count: number }[]>(`/api/topic/${id}/related-topics`)

const sortBy = cache.get<string>("feed.sort", () => "new")
const feed = useDatasource<Sortable[]>(`/api/topic/${id}/feed`, {
    query: {
        sortBy: sortBy
    }
})

// TODO add rules/summary page with versioned history
// TODO add ability for moderators to feature or pin specific posts within the topic feed, with appropriate role checks and visual indicators.
// TODO determine related topics based on shared usage in posts and threads, and display them on the topic page to encourage content discovery and topic exploration.
</script>

<template>
    <article class="p-4">
        <template v-if="topic.data.value">
            <div class="row g-2">
                <section class="f-1">
                    <TopicPreview :topic="topic.data.value" @refresh="topic.refresh()" />
                    <Feed :items="feed" :sorting="true" @refresh="(type) => sortBy = type">
                        <template #item="item">
                            <MultiPreview :item="item" />
                        </template>
                    </Feed>
                </section>
                <aside class="sidebar box column g-2 p-4">
                    <h3>Moderators</h3>
                    <section>
                        <template v-for="mod in topic.data.value.moderators">
                            <UserTag :user="mod" />
                        </template>
                    </section>
                    <h3>Related</h3>
                    <section class="row wrap g-2">
                        <template v-for="topic in related.data.value">
                            <TopicTag :topic="topic.id" />
                        </template>
                    </section>
                </aside>
            </div>
        </template>
        <section v-else class="box p-3 text center">
            <p>This topic hasn't been used yet.</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

aside.sidebar {
    min-width: 10rem;
}
</style>