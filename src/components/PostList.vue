<template>
    <div class="navbar box p-1 is-flex is-flex-direction-row">
        <div class="navbar-brand">
            <p class="navbar-item px-4">Hot</p>
            <p class="navbar-item px-4">Top</p>
            <p class="navbar-item px-4">New</p>
        </div>
    </div>
    <div class="media box p-0 my-4" v-for="post in posts" :key="post.post_id">
        <div class="media-left mr-0 mb-auto">
            <div class="container p-2">
                <p
                    @click="upvote(post)"
                    class="vote is-size-6 has-text-centered has-text-weight-bold has-text-primary"
                >{{ formatNumber(post.votes?.upvotes) }}</p>
                <p
                    @click="misleading(post)"
                    class="vote is-size-6 has-text-centered has-text-weight-bold has-text-warning"
                >{{ formatNumber(post.votes?.misleading) }}</p>
                <p
                    @click="downvote(post)"
                    class="vote is-size-6 has-text-centered has-text-weight-bold has-text-danger"
                >{{ formatNumber(post.votes?.downvotes) }}</p>
            </div>
        </div>
        <div class="media-content" @click="openPost(post)">
            <header class="card-header has-background-light">
                <p class="card-header-title is-size-4 p-1 px-4">{{ post.title }}</p>
            </header>
            <div class="tags py-2">
                <span class="tag is-medium is-primary is-light">u/{{ post.user?.username }}</span>
                <span class="tag is-medium is-info is-light">{{ post.time }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { inject, onBeforeMount, ref } from 'vue';
import { Post } from '../api/types';
import { router } from '../services/router';
import { store } from '../services/store';

const posts = ref<Post[]>([]);
onBeforeMount(() => getPosts())

const toggleModal = inject("toggleModal") as Function

function formatNumber(number: number): number | string {
    if (number > 999) return ((number/1000).toFixed(0) + 'k')
    return number;
}

function canVote(post: Post) {
    if (!store.getters.getSession.authenticated) {
        toggleModal("You must be logged in to vote.");
        return false;
    };

    const user_id = store.getters.getCurrentUserId;
    if (post.votes.users.includes(user_id)) {
        toggleModal("You may only vote on a post once.");
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
    console.log(response.data);
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
    width: 3.5em;
}
</style>