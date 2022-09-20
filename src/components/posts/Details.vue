<script setup lang="ts">
import { Post } from '../../api/types';
import { timeSince } from '../../services/dateTime';

const props = defineProps<{ post: Post }>();

</script>

<template>
    <div class="block mb-2">
        <h2 class="title is-4 mb-2">{{ post?.title }}</h2>
        <div class="details mt-2">
            <p class="vote tag is-light is-primary">{{ post?.votes.upvotes.length }}</p>
            <p class="vote tag is-light is-warning">{{ post?.votes.misleading.length }}</p>
            <p class="vote tag is-light is-danger">{{ post?.votes.downvotes.length }}</p>
            <p class="topic tag is-light is-link" v-for="topic in post?.topics">{{ topic }}</p>
            <p class="username tag is-light is-primary">u/{{ post?.user?.username }}</p>
            <p class="time tag is-light is-info">{{ timeSince(post?.time) }}</p>
        </div>
    </div>
    <div class="box p-4 my-2 has-background-light is-shadowless">
        <p class="post-content preserve" v-html="post?.content"></p>
    </div>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.details {
    @include flex-hw;
    gap: 0.25em;

    .topic,
    .username,
    .time {
        flex: 1 1 0;
    }

    p {
        font-weight: 600;
        font-size: 0.8em;
    }
}

.post-content {
    font-weight: 500;
    font-size: 1em;
}

.preserve {
    white-space: pre-wrap;
}
</style>