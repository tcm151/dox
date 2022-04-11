<template>
    <div v-if="posts.length > 0">
        <div class="media box p-2 mb-1" v-for="post in posts" :key="post.post_id">
            <div class="media-left pr-2 m-0">
                <div class="container">
                    <p @click="upvote(post)"
                        class="vote is-size-8 has-text-centered has-text-weight-bold has-text-primary">{{
                            formatNumber(post.votes?.upvotes)
                        }}</p>
                    <p @click="misleading(post)"
                        class="vote is-size-6 has-text-centered has-text-weight-bold has-text-warning">{{
                            formatNumber(post.votes?.misleading)
                        }}</p>
                    <p @click="downvote(post)"
                        class="vote is-size-6 has-text-centered has-text-weight-bold has-text-danger">{{
                            formatNumber(post.votes?.downvotes)
                        }}</p>
                </div>
            </div>
            <div class="media-content" @click="openPost(post)">
                <div class="box m-0 is-shadowless has-background-light p-2">
                    <p class="title is-5 has-text-weight-bold m-0">{{ post.title }}</p>
                </div>
                <div class="level-left pt-1">
                    <p class="tag mr-1 is-primary is-light">u/{{ post.user?.username }}</p>
                    <p class="tag mr-1 is-info is-light">{{ post.time }}</p>
                </div>
            </div>
        </div>
    </div>
    <div class="box content m-5" v-else>
        <i>There are no posts yet...</i>
    </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { Post } from '../api/types';
import { store } from '../services/store';
import { router } from '../services/router';

defineProps<{
    posts: Post[]
}>();

const toggleModal = inject("toggleModal") as Function

function formatNumber(number: number): number | string {
    if (number > 999999) return ((number / 1000000).toFixed(0) + 'm')
    if (number > 999) return ((number / 1000).toFixed(0) + 'k')
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
</style>