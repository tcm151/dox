<script setup lang="ts">
const { data: topics } = await useAsyncData('topics', () => {
    return $fetch("/api/topic")
})
</script>

<template>
    <article class="column g-2 m-4 p-4">
        <section class="topic-item row" v-for="topic in topics">
            <h2 @click="navigateTo(`/topic/${extractId(topic.id)}`)">
                {{ extractId(topic.id) }}
            </h2>
            <div class="row g-1">
                <span class="tag positive">{{ topic.votes.positive.length }}</span>
                <span class="tag misleading">{{ topic.votes.misleading.length }}</span>
                <span class="tag negative">{{ topic.votes.negative.length }}</span>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(400px, 1rem);
    border-radius: 0.25rem;
    background-color: $dox-white-0;
}

section.row {
    justify-content: space-between;
    align-items: center;

    h2 {
        cursor: pointer;  
    }
}
</style>