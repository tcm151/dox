<script setup lang="ts">
import type { Topic, Sortable } from '@@/shared/types'

const cache = useCache()
const route = useRoute()
const session = getSession()

const id = route.params.topic?.toString()
await useDatasource(`/api/topic/${id}/visit`)
const topic = await useDatasource<Topic>(`/api/topic/${id}`)

const sortBy = cache.get<string>("feed.sort", () => "new")
const feed = useDatasource<Sortable[]>(`/api/topic/${id}/feed`, {
    query: {
        sortBy: sortBy
    }
})

let following = computed(() => {
    return session.user.topics.includes(topic.data.value?.id ?? "")
})

async function requestModeration() {
    await useApi(`/api/topic/${id}/request-moderation`)
}
</script>

<template>
    <article class="p-4">
        <template v-if="topic.data.value">
            <section class="column g-2">
                <Authenticated>
                    <header class="row g-2">
                        <button v-if="following" class="f-1 b-0" @click="requestModeration">
                            <i class="fa-solid fa-screwdriver-wrench"></i>
                            Request Moderation
                        </button>
                        <button v-if="hasRole(session.user, 'admin')" class="f-1 b-0" @click="navigateTo(`/topic/${id}/moderation`)">
                            <i class="fa-solid fa-screwdriver-wrench"></i>
                            Moderate
                        </button>
                    </header>
                </Authenticated>
                <TopicPreview :topic="topic.data.value" @refresh="topic.refresh()" />
                <Feed :items="feed" :sorting="true" @refresh="(type) => sortBy = type">
                    <template #item="item">
                        <MultiPreview :item="item" />
                    </template>
                </Feed>
            </section>
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
</style>