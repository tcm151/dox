<script setup lang="ts">
const { data: topics } = await useAsyncData('topics', () => {
    return $fetch("/api/topic")
})
</script>

<template>
    <article class="column g-2 p-4">
        <TopicPreview v-for="topic in topics" :topic="topic" />
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}
</style>