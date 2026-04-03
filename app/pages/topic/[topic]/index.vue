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
</script>

<template>
    <article class="p-4">
        <template v-if="topic.data.value">
            <section class="column g-2">
                <Authenticated>
                    <header class="row g-2">
                        
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