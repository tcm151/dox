<script setup lang="ts">
import axios from 'axios';
import { inject, onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Post } from '../api/types';
import PostList from '../components/posts/PostList.vue';
import Sorter from '../components/utilities/Sorter.vue';

const route = useRoute();
const topicPosts = ref<Post[]>([])

const toggleModal = inject("toggleModal") as Function;

onBeforeMount(fetchPosts)
watch(() => route.params, (params) => fetchPosts())

async function fetchPosts() {
    try {
        const topicPostsResponse = await axios.get<Post[]>(`https://doxforeverything.herokuapp.com/posts/topic/${route.params.topic}`)
        topicPosts.value = topicPostsResponse.data;
    }
    catch (error: any) {
        console.log(error);
        toggleModal("Failed to load posts...", "Server may be in a non-functioning state.")
    }
}

</script>

<template>
    <div>
        <div class="topic-header box my-2 py-3">
            <p class="title my-0">{{ route.params.topic }}</p>
            <button class="button is-primary">
                <i class="fa-solid fa-plus"></i>
                <p>Follow</p>
            </button>
        </div>
        <Sorter post-filter="N/A" />
        <PostList :posts="topicPosts" />
    </div>
</template>

<style scoped lang="scss">
@import '../styles/global.scss';

.topic-header {
    gap: 1em;
    @include flex-h;
    justify-content: space-between;

    button {
        gap: 0.5em;
        @include flex-h;

        padding: 0.2em 0.8em;

        p {
            transform: translateY(1px);
        }
    }
}
</style>