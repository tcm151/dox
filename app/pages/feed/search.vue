<script setup lang="ts">
import type { SearchResult, Topic } from '@@/shared/types'

const route = useRoute()
const router = useRouter()

function queryValue(value: unknown) {
    return typeof value === "string" ? value : ""
}

const filters = reactive({
    text: queryValue(route.query.text),
    type: queryValue(route.query.type),
    topic: queryValue(route.query.topic),
    user: queryValue(route.query.user),
    from: queryValue(route.query.from),
    to: queryValue(route.query.to),
})

const topics = useDatasource<Pick<Topic, "id" | "score">[]>("/api/topic/available")
const feed = useDatasource<SearchResult[]>("/api/feed/search", {
    watch: false,
    query: {
        text: computed(() => filters.text),
        type: computed(() => filters.type || undefined),
        topic: computed(() => filters.topic || undefined),
        user: computed(() => filters.user || undefined),
        from: computed(() => filters.from || undefined),
        to: computed(() => filters.to || undefined),
    },
})

const loading = computed(() => feed.status.value.toString() == "pending")

watch(() => route.fullPath, () => {
    Object.assign(filters, {
        text: queryValue(route.query.text),
        type: queryValue(route.query.type),
        topic: queryValue(route.query.topic),
        user: queryValue(route.query.user),
        from: queryValue(route.query.from),
        to: queryValue(route.query.to),
    })
    feed.refresh()
})

async function search() {
    const query = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== ""),
    )
    const location = { path: route.path, query }

    if (router.resolve(location).fullPath === route.fullPath) {
        await feed.refresh()
        return
    }

    await router.push(location)
}
</script>

<template>
    <section class="content-width feed column g-2 p-4">
        <header class="box column g-2 p-2" @keyup.enter.prevent="search">
            <div class="field row g-2">
                <ButtonSpinner class="link" :loading="loading" aria-label="Search" @click="search">
                    <i class="fa-solid fa-magnifying-glass" />
                </ButtonSpinner>
                <input class="f-1" type="search" placeholder="Search..." aria-label="Search..." v-model="filters.text">
            </div>
            <div class="filters row wrap g-2">
                <div class="field f-1">
                    <label for="search-type">Type</label>
                    <select id="search-type" v-model="filters.type">
                        <option value="">All types</option>
                        <option value="post">Posts</option>
                        <option value="thread">Threads</option>
                        <option value="gallery">Galleries</option>
                        <option value="comment">Comments</option>
                    </select>
                </div>
                <div class="field f-1">
                    <label for="search-topic">Topic</label>
                    <select id="search-topic" v-model="filters.topic">
                        <option value="">All topics</option>
                        <option v-for="topic in topics.data.value ?? []" :key="topic.id" :value="extractId(topic.id)">
                            {{ extractId(topic.id) }}
                        </option>
                    </select>
                </div>
                <div class="field f-1">
                    <label for="search-user">Author</label>
                    <input id="search-user" type="search" maxlength="32" placeholder="Author name" v-model="filters.user">
                </div>
                <div class="field f-1">
                    <label for="search-from">From</label>
                    <input id="search-from" type="date" v-model="filters.from">
                </div>
                <div class="field f-1">
                    <label for="search-to">To</label>
                    <input id="search-to" type="date" v-model="filters.to">
                </div>
            </div>
        </header>
        <Feed :items="feed">
            <template #item="item">
                <MultiPreview :item="item" />
            </template>
        </Feed>
    </section>
</template>
