<script setup lang="ts">
const route = useRoute()
const topic = route.params.topic.toString()
const { info, posts, followers } = useTopic(topic)
</script>

<template>
    <article class="column g-2 p-4">
        <TopicPreview :topic="info.value!" />
        <Feed
            :sorting="true"
            :loading="posts.loading"
            :items="posts.items ?? []"
            @refresh="posts.fetch"
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