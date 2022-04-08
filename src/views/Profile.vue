<template>
    <div v-if="session.authenticated">
        <div class="box m-5">
            <p class="title">{{ session.user?.username }}</p>
        </div>
        <div class="box m-5 scrollable">
            <p class="title">Posts</p>
            <PostList :posts="posts" />
        </div>
        <div class="box m-5 scrollable">
            <p class="title">Comments</p>
            <CommentList :comments="comments" />
        </div>
    </div>
    <div class="box m-5" v-else>
        <p>Not logged in.</p>
    </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { store } from '../services/store';
import { Post, Comment } from '../api/types';
import { ref, computed, onBeforeMount } from 'vue';
import PostList from '../components/PostList.vue';
import CommentList from '../components/CommentList.vue';

const session = computed(() => {
    return store.state.session;
})

const posts = ref<Post[]>([]);
const comments = ref<Comment[]>([]);

onBeforeMount(async () => {
    const postsResponse = await axios.get(`https://doxforeverything.herokuapp.com/users/${session.value.user?.user_id}/posts`)
    posts.value = postsResponse.data;

    const commentsResponse = await axios.get(`https://doxforeverything.herokuapp.com/users/${session.value.user?.user_id}/comments`)
    comments.value = commentsResponse.data;
})

</script>

<style scoped>
.scrollable {
    max-height: 25em;
    overflow: auto;
}
</style>