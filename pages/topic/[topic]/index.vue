<script setup lang="ts">
import type { Topic, Post } from '~/types'

const route = useRoute()
const topicId = route.params.topic?.toString()

const topic = await useFetch<Topic>(`/api/topic/${topicId}`)
const posts = await useFetch<Post[]>(`/api/topic/${topicId}/posts`)

</script>

<template>
    <article class="column g-2 p-4" v-if="topic.data.value">
        <TopicPreview :topic="topic.data.value" />
        <Feed :items="posts" :sorting="true">
            <template #item="post">
                <PostPreview :post="post" />
            </template>
        </Feed>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>