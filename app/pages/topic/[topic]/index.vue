<script setup lang="ts">
import type { Topic, Sortable } from '@@/shared/types'

const cache = useCache()
const route = useRoute()
const moderator = useModeration()

const id = route.params.topic?.toString()
await useDatasource(`/api/topic/${id}/visit`)
const { data: topic, refresh } = await useDatasource<Topic>(`/api/topic/${id}`, {
    key: `topic:${id}`,
})

const related = await useDatasource<{ id: string, count: number }[]>(`/api/topic/${id}/related-topics`)

const sortBy = cache.get<string>("feed.sort", () => "new")
const feed = useDatasource<Sortable[]>(`/api/topic/${id}/feed`, {
    query: {
        sortBy: sortBy
    }
})

// TODO add rules/summary page with versioned history
// TODO add ability for moderators to feature or pin specific posts within the topic feed, with appropriate role checks and visual indicators.
</script>

<template>
    <article class="p-4">
        <template v-if="topic">
            <div class="row g-2">
                <section class="column g-2 f-1">
                    <TopicPreview :topic="topic" @refresh="refresh()" />
                    <Feed :items="feed" :sorting="true" @refresh="(type) => sortBy = type">
                        <template #item="item">
                            <MultiPreview :item="item" />
                        </template>
                    </Feed>
                </section>
                <aside class="sidebar box column g-2 p-4">
                    <Authenticated>
                        <button v-if="moderator.canRequest(topic)" class="small" @click="moderator.request(topic)">
                            <i class="fa-solid fa-hand"></i>
                            Request Moderator
                        </button>
                    </Authenticated>
                    <h3>Moderators</h3>
                    <section class="column g-1">
                        <template v-if="topic.moderators.length > 0">
                            <UserTag v-for="mod in topic.moderators" :user="mod" />
                        </template>
                        <Tag v-else type="danger" label="None" />
                    </section>
                    <h3>Related Topics</h3>
                    <section class="column g-1">
                        <TopicTag v-for="topic in related.data.value" :topic="topic.id" />
                    </section>
                    <Authenticated>
                        <template v-if="moderator.forTopic(topic)">
                            <h3>Tools</h3>
                            <button class="small" @click="navigateTo(`/topic/${id}/profile`)">
                                <i class="fa-solid fa-address-card"></i>
                                Profile
                            </button>
                        </template>
                    </Authenticated>
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
    height: fit-content;
    min-width: 15rem;
}
</style>