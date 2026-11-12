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
        <section v-if="topics && topics.length > 0" class="box column g-2 p-3">
            <template v-for="topic in topics" :key="topic.id">
                <div class="row wrap g-1">
                    <TopicTag class="f-1" :topic="topic.id" />
                    <Tag type="default" icon="fa-address-card" @click="navigateTo(`/topic/${extractId(topic.id)}/tools/profile`)" />
                    <Tag type="danger" icon="fa-flag" @click="navigateTo(`/topic/${extractId(topic.id)}/tools/reports`)" />
                </div>
            </template>
        </section>
        <section v-else-if="topics" class="box empty-state" aria-live="polite">
            <p>You aren't moderating any topics.</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>