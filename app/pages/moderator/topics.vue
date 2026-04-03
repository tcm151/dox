<script setup lang="ts">
import type { Topic } from "@@/shared/types"

const route = useRoute()

const { data: topics } = await useDatasource<Topic[]>(`/api/moderator/topics`)
</script>

<template>
    <article class="column g-2 p-4">
        <section v-if="topics && topics.length > 0" class="box column g-2 p-3">
            <div class="row g-1" v-for="topic in topics">
                <Votes :target="topic" />
                <TopicTag :topic="topic.id" />
                <DurationTag width="6rem" :time="topic.firstUsed" />
            </div>
        </section>
        <footer v-else class="box p-3 text center">
            <p>You aren't moderating any topics.</p>
        </footer>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width (40rem, 1rem);
}
</style>