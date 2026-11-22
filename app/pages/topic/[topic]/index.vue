<script setup lang="ts">
import type { Pin, Topic, Sortable } from '@@/shared/types'

const route = useRoute()
const session = getSession()
const moderator = useModeration()

const isAdmin = computed(() => hasRole(session.user, "admin"))

const id = route.params.topic?.toString()
await useDatasource(`/api/topic/${id}/visit`)

const related = await useDatasource<{ id: string, count: number }[]>(`/api/topic/${id}/related-topics`)
const { data: topic, refresh } = await useDatasource<Topic>(`/api/topic/${id}`, {
    key: `topic:${id}`,
})

const pins = useDatasource<Pin[]>(`/api/topic/${id}/pins`)

const feed = useFeedDatasource<Sortable>(`/api/topic/${id}/feed`, {
    sorting: true,
})
</script>

<template>
    <article class="p-4">
        <template v-if="topic">
            <div class="row g-2">
                <section class="column g-2 f-1">
                    <TopicPreview :topic="topic" @refresh="refresh()" />
                    <template v-for="pin in pins.data.value" :key="pin.id">
                        <MultiPreview :item="pin.item" pinned />
                    </template>
                    <Feed :items="feed">
                        <template #item="item">
                            <MultiPreview :item="item" />
                        </template>
                    </Feed>
                </section>
                <aside class="sidebar box column g-2 p-4">
                    <Tag v-if="topic.status === 'locked'" type="warning" icon="fa-lock" label="Locked" />
                    <Authenticated>
                        <button v-if="session.moderates([topic.id])" class="small" @click="navigateTo(`/topic/${id}/tools/profile`)">
                            <i class="fa-solid fa-address-card"></i>
                            Profile
                        </button>
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
                    <section v-if="topic.rules" class="column g-1">
                        <h3>Rules</h3>
                        <Markdown compact class="content" :content="topic.rules" />
                    </section>
                </aside>
            </div>
        </template>
        <section v-else class="box empty-state">
            <p>This topic hasn't been used yet.</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(75rem, 1rem);
}

aside.sidebar {
    height: fit-content;
    min-width: 18rem;

    @media (max-width: $bp-tablet) {
        display: none;
    }
}
</style>