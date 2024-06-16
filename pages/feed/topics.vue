<script setup lang="ts">
import type { Topic } from '~/types';

const { data: topics } = await useAsyncData('topics', () => {
    return $fetch<Topic[]>("/api/topic")
})
</script>

<template>
    <article class="column g-2 p-4">
        <TopicPreview v-for="topic in topics" :topic="topic" />
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>