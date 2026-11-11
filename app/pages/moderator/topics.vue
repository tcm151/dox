<script setup lang="ts">
import type { Topic } from "@@/shared/types"

const route = useRoute()

const { data: topics, pending, refresh } = await useAuthenticatedDatasource<Topic[]>(`/api/moderator/topics`)
</script>

<template>
    <article class="column g-2 p-4">
        <header class="row wrap inline between g-2">
            <h1>Topics</h1>
            <ButtonSpinner class="dark" :loading="pending" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </ButtonSpinner>
        </header>
        <section v-if="topics && topics.length > 0" class="box column g-2 p-3" aria-label="Moderated topics">
            <template v-for="topic in topics" :key="topic.id">
                <article class="row wrap inline g-1" :aria-label="`Moderated topic ${extractId(topic.id)}`">
                    <TopicTag class="f-1" :topic="topic.id" />
                    <Tag type="default" icon="fa-address-card" aria-label="View topic profile" @click="navigateTo(`/topic/${extractId(topic.id)}/profile`)" />
                    <Tag type="danger" icon="fa-flag" aria-label="View topic reports" @click="navigateTo(`/topic/${extractId(topic.id)}/reports`)" />
                </article>
            </template>
        </section>
        <section v-else class="box empty-state" aria-live="polite">
            <p>You aren't moderating any topics.</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>