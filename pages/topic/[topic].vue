<script setup lang="ts">
import type { Topic, Post } from '~/types';

const route = useRoute()
const topicId = route.params.topic.toString()

const { data: topic } = useAsyncData(`topic:${topicId}`, () => {
    return $fetch<Topic>(`/api/topic/${topicId}`)
})
const { data: posts, pending, refresh } = useAsyncData(`topic:${topicId}/posts`, () => {
    return $fetch<Post[]>(`/api/topic/${topicId}/posts`)
})

</script>

<template>
    <article class="column g-2 p-4">
        <TopicPreview :topic="topic!" />
        <Feed
            :sorting="true"
            :loading="pending"
            :items="posts ?? []"
            @refresh="refresh"
        >
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