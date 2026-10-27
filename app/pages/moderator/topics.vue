<script setup lang="ts">
import type { Topic } from "@@/shared/types"

const route = useRoute()

const { data: topics } = await useDatasource<Topic[]>(`/api/moderator/topics`)
</script>

<template>
    <article class="column g-2 p-4">
        <section v-if="topics && topics.length > 0" class="box column g-2 p-3">
            <div class="row g-1" v-for="topic in topics">
                <TopicTag :topic="topic.id" />
                <Tag type="default" icon="fa-address-card" @click="navigateTo(`/topic/${extractId(topic.id)}/profile`)" />
                <Tag type="danger" icon="fa-flag" @click="navigateTo(`/topic/${extractId(topic.id)}/reports`)" />
            </div>
        </section>
        <footer v-else class="box empty-state">
            <p>You aren't moderating any topics.</p>
        </footer>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width (40rem, 1rem);
}
</style>