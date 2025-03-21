<script setup lang="ts">
import type { Topic, Post } from '~/types'

const route = useRoute()
const topicId = route.params.topic.toString()

const { data: topic } = await useFetch<Topic>(`/api/topic/${topicId}`)
const { data: posts, status, refresh } = await useFetch<Post[]>(`/api/topic/${topicId}/posts`)

</script>

<template>
    <article class="column g-2 p-4">
        <TopicPreview :topic="topic!" />
        <Feed
            :sorting="true"
            :status="status"
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