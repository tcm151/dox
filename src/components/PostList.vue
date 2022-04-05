<template>
    <div class="navbar box p-1 is-flex is-flex-direction-row">
        <div class="navbar-brand">
            <p class="navbar-item px-4">Hot</p>
            <p class="navbar-item px-4">Top</p>
            <p class="navbar-item px-4">New</p>
        </div>
    </div>
    <div class="card block" v-for="post in posts" :key="post.post_id">
        <div class="media">
            <div class="media-left mr-0 mb-auto">
                <div class="container p-2">
                    <p
                        @click="upvote(post)"
                        class="vote is-size-6 has-text-centered has-text-weight-bold has-text-primary"
                    >{{ post.votes?.upvotes }}</p>
                    <p
                        @click="misleading(post)"
                        class="vote is-size-6 has-text-centered has-text-weight-bold has-text-warning"
                    >{{ post.votes?.misleading }}</p>
                    <p
                        @click="downvote(post)"
                        class="vote is-size-6 has-text-centered has-text-weight-bold has-text-danger"
                    >{{ post.votes?.downvotes }}</p>
                </div>
            </div>
            <div class="media-content" @click="openPost(post)">
                <header class="card-header has-background-light">
                    <div class="is-flex is-flex-direciont-row">
                        <p class="card-header-title is-size-4 p-1 px-4">{{ post.title }}</p>
                    </div>
                </header>
                <div class="card-content p-2">
                    <div class="content post-body">{{ post.content }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { onBeforeMount, ref } from 'vue';
import { Post } from '../api/types';
import { router } from '../services/router';
import { store } from '../services/store';

const posts = ref<Post[]>([]);
onBeforeMount(() => getPosts())

function canVote(post: Post) {
    if (!store.getters.getSession.authenticated) {
        console.log("You must be logged in to vote.");
        return false;
    };

    const user_id = store.getters.getCurrentUserId;
    if (post.votes.users.includes(user_id)) {
        console.log("You may only vote on a post once.");
        return false;
    };

    return true;
}

function upvote(post: Post) {
    if (!canVote(post)) return;

    console.log("Upvoted post!");
    post.votes.upvotes += 1;
    post.votes.users.push(store.getters.getCurrentUserId)
}

function misleading(post: Post) {
    if (!canVote(post)) return;

    console.log("Post marked misleading...")
    post.votes.misleading += 1
    post.votes.users.push(store.getters.getCurrentUserId)
}
function downvote(post: Post) {
    if (!canVote(post)) return;

    console.log("Downvoted post!")
    post.votes.downvotes += 1
    post.votes.users.push(store.getters.getCurrentUserId)
}


function openPost(post: Post) {
    router.push(`/posts/${post.post_id}`);
}

async function getPosts() {
    const response = await axios.get<Post[]>("http://localhost:8080/posts")
    posts.value = response.data;
}
</script>

<style scoped>
.vote,
media {
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
}

.media-left {
    width: 3em;
}

/* .post-body {
    max-height: 4em;
} */
</style>