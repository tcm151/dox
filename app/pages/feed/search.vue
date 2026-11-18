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
const advancedFiltersExpanded = ref(false)

const topics = useDatasource<Pick<Topic, "id" | "score">[]>("/api/topic/available")
const searchQuery = computed(() => ({
    text: queryValue(route.query.text),
    type: queryValue(route.query.type) || undefined,
    topic: queryValue(route.query.topic) || undefined,
    user: queryValue(route.query.user) || undefined,
    from: queryValue(route.query.from) || undefined,
    to: queryValue(route.query.to) || undefined,
}))
const feed = useFeedDatasource<SearchResult>("/api/feed/search", {
    query: searchQuery,
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
                <button type="button" class="link" :aria-expanded="advancedFiltersExpanded" @click="advancedFiltersExpanded = !advancedFiltersExpanded" @keyup.enter.stop>
                    <i :class="advancedFiltersExpanded ? 'fa-solid fa-angles-up' : 'fa-solid fa-angles-down'" aria-hidden="true" />
                </button>
            </div>
            <div v-show="advancedFiltersExpanded" class="filters row wrap fill g-2">
                <div class="field f-1">
                    <label for="search-type">Type</label>
                    <select id="search-type" class="px-2 py-1" v-model="filters.type">
                        <option value="">All Content</option>
                        <option value="post">Posts</option>
                        <option value="thread">Threads</option>
                        <option value="gallery">Galleries</option>
                        <option value="link">Links</option>
                        <option value="comment">Comments</option>
                    </select>
                </div>
                <div class="field f-1">
                    <label for="search-topic">Topic</label>
                    <select id="search-topic" class="px-2 py-1" v-model="filters.topic">
                        <option value="">All Topics</option>
                        <option v-for="topic in topics.data.value ?? []" :key="topic.id" :value="extractId(topic.id)">
                            {{ extractId(topic.id) }}
                        </option>
                    </select>
                </div>
                <div class="field f-1">
                    <label for="search-user">Author</label>
                    <input id="search-user" class="px-2 py-1" type="search" maxlength="32" placeholder="Username" v-model="filters.user">
                </div>
                <div class="row wrap fill g-2">
                    <div class="field">
                        <label for="search-from">From</label>
                        <input id="search-from" class="px-2 py-1" type="date" v-model="filters.from">
                    </div>
                    <div class="field">
                        <label for="search-to">To</label>
                        <input id="search-to" class="px-2 py-1" type="date" v-model="filters.to">
                    </div>
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

<style scoped lang="scss">
.field {
    label {
        margin-bottom: 0.25rem;
    }
}
</style>