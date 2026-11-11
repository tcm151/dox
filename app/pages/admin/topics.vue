<script setup lang="ts">
import type { Topic, TopicStatus } from "@@/shared/types"

const hints = useHints()
const { data: topics, pending, refresh } = await useAuthenticatedDatasource<Topic[]>("/api/topic")

const search = ref("")
const statusFilter = ref<TopicStatus | "all">("all")
const savingTopicId = ref<string>()

const filteredTopics = computed(() => {
    const searchText = search.value.trim().toLowerCase()
    return (topics.value ?? []).filter((topic) => {
        const name = extractId(topic.id) ?? ""
        return (statusFilter.value === "all" || topic.status === statusFilter.value)
            && name.toLowerCase().includes(searchText)
    })
})

async function toggleLock(topic: Topic) {
    if (savingTopicId.value) return

    const action = topic.status === "locked" ? "unlock" : "lock"
    savingTopicId.value = topic.id
    try {
        await useApi(`/api/topic/${extractId(topic.id)}/${action}`, { method: "POST" })
        hints.addSuccess(`Topic ${extractId(topic.id)} ${action === "lock" ? "locked" : "unlocked"}.`)
        await refresh()
    }
    catch (error: any) {
        hints.addError(`Failed to ${action} topic.`, error)
    }
    finally {
        savingTopicId.value = undefined
    }
}
</script>

<template>
    <article class="content-width column g-2 p-4">
        <header class="row wrap inline between g-2">
            <h1>Topics</h1>
            <ButtonSpinner class="dark" :loading="pending" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </ButtonSpinner>
        </header>
        <nav class="row wrap g-2">
            <button type="button" class="f-1 b-0" :class="{ selected: statusFilter === 'all' }" @click="statusFilter = 'all'">
                <span>All</span>
            </button>
            <button type="button" class="f-1 b-0" :class="{ selected: statusFilter === 'active' }" @click="statusFilter = 'active'">
                <span>Active</span>
            </button>
            <button type="button" class="f-1 b-0" :class="{ selected: statusFilter === 'locked' }" @click="statusFilter = 'locked'">
                <span>Locked</span>
            </button>
        </nav>
        <section v-if="filteredTopics.length > 0" class="box column g-2 p-3">
            <template v-for="topic in filteredTopics" :key="topic.id">
                <div class="row wrap inline g-1">
                    <Votes :target="topic" />
                    <TopicTag class="f-8 b-0" :topic="topic.id" />
                    <DurationTag v-if="topic.firstUsed" width="6rem" :time="topic.firstUsed" />
                    <template v-if="topic.status == 'active'">
                        <Tag class="success f-1 b-0" label="Active" @click="toggleLock(topic)" />
                    </template>
                    <template v-if="topic.status == 'locked'">
                        <Tag class="danger f-1 b-0" label="Locked" icon="fa-lock" @click="toggleLock(topic)" />
                    </template>
                </div>
            </template>
        </section>
        <section v-else-if="topics" class="box empty-state" aria-live="polite">
            <p>No topics match these filters.</p>
        </section>
    </article>
</template>
