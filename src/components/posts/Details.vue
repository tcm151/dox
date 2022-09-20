<script setup lang="ts">
import { Post } from '../../api/types';
import { timeSince } from '../../services/dateTime';

const props = defineProps<{ post: Post }>();

</script>

<template>
    <div class="block mb-4">
        <h2 class="title is-4 mb-2">{{ post?.title }}</h2>
        <div class="tags mt-2">
            <p class="tag mb-1 mr-1 is-light is-primary">{{ post?.votes.upvotes.length }}</p>
            <p class="tag mb-1 mr-1 is-light is-warning">{{ post?.votes.misleading.length }}</p>
            <p class="tag mb-1 mr-1 is-light is-danger">{{ post?.votes.downvotes.length }}</p>
            <p class="tag mb-1 mr-1 is-light is-primary" v-for="topic in post?.topics">{{ topic }}</p>
            <p class="tag mb-1 mr-1 is-light is-info">u/{{ post?.user?.username }}</p>
            <p class="tag mb-1 mr-1 is-light is-info">{{ timeSince(post?.time) }}</p>
        </div>
    </div>
    <div class="box p-4 my-2 has-background-light is-shadowless">
        <p class="post-content preserve" v-html="post?.content"></p>
    </div>
</template>

<style scoped lang="scss">
.tag {
    font-weight: 600;
    font-size: 0.8em;
}

.post-content {
    font-weight: 500;
    font-size: 1em;
}

.preserve {
    white-space: pre-wrap;
}
</style>