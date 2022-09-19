<script setup lang="ts">
import axios from 'axios';
import { inject, onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Post } from '../api/types';
import PostList from '../components/posts/PostList.vue';

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
    <PostList :posts="topicPosts" />
</template>