<script setup lang="ts">
import axios from "axios";
import { inject } from 'vue';
import { Post, User } from '../../api/types';
import { store } from '../../services/store';
import { navigateTo, router } from '../../services/router';
import { timeSince } from '../../services/dateTime';

defineProps<{ posts: Post[] }>();

const toggleModal = inject("toggleModal") as Function

function formatNumber(number: number): number | string {
    if (number > 999999) return ((number / 1000000).toFixed(0) + 'm')
    if (number > 999) return ((number / 1000).toFixed(0) + 'k')
    return number;
}

function upvote(post: Post) {
    if (!store.state.session.authenticated) {
        toggleModal("You must be logged in to vote", "Please login or create an account to interact with others")
        return;
    }

    if (!post.votes.upvotes.includes(store.getters.getCurrentUserId)) post.votes.upvotes.push(store.getters.getCurrentUserId)
    if (post.votes.misleading.includes(store.getters.getCurrentUserId)) post.votes.misleading = post.votes.misleading.filter(id => id !== store.getters.getCurrentUserId)
    if (post.votes.downvotes.includes(store.getters.getCurrentUserId)) post.votes.downvotes = post.votes.downvotes.filter(id => id !== store.getters.getCurrentUserId)

    axios.patch(`https://doxforeverything.herokuapp.com/posts/${post.post_id}/votes`, new URLSearchParams({ votes: JSON.stringify(post.votes) }))
}
function misleading(post: Post) {
    if (!store.state.session.authenticated) {
        toggleModal("You must be logged in to vote", "Please login or create an account to interact with others")
        return;
    }

    if (post.votes.upvotes.includes(store.getters.getCurrentUserId)) post.votes.upvotes = post.votes.upvotes.filter(id => id !== store.getters.getCurrentUserId)
    if (!post.votes.misleading.includes(store.getters.getCurrentUserId)) post.votes.misleading.push(store.getters.getCurrentUserId)
    if (post.votes.downvotes.includes(store.getters.getCurrentUserId)) post.votes.downvotes = post.votes.downvotes.filter(id => id !== store.getters.getCurrentUserId)

    axios.patch(`https://doxforeverything.herokuapp.com/posts/${post.post_id}/votes`, new URLSearchParams({ votes: JSON.stringify(post.votes) }))
}
function downvote(post: Post) {
    if (!store.state.session.authenticated) {
        toggleModal("You must be logged in to vote", "Please login or create an account to interact with others")
        return;
    }

    if (post.votes.upvotes.includes(store.getters.getCurrentUserId)) post.votes.upvotes = post.votes.upvotes.filter(id => id !== store.getters.getCurrentUserId)
    if (post.votes.misleading.includes(store.getters.getCurrentUserId)) post.votes.misleading = post.votes.misleading.filter(id => id !== store.getters.getCurrentUserId)
    if (!post.votes.downvotes.includes(store.getters.getCurrentUserId)) post.votes.downvotes.push(store.getters.getCurrentUserId)

    axios.patch(`https://doxforeverything.herokuapp.com/posts/${post.post_id}/votes`, new URLSearchParams({ votes: JSON.stringify(post.votes) }))
}

</script>


<template>
    <div v-if="posts.length > 0">
        <div class="post media box my-2 p-2" v-for="post in posts" :key="post.post_id">
            <div class="media-left pr-2 m-0">
                <div class="votes-left">
                    <p @click="upvote(post)"
                        class="vote is-size-8 has-text-centered has-text-weight-bold has-text-primary">{{
                        formatNumber(post.votes?.upvotes.length)
                        }}</p>
                    <p @click="misleading(post)"
                        class="vote is-size-6 has-text-centered has-text-weight-bold has-text-warning">{{
                        formatNumber(post.votes?.misleading.length)
                        }}</p>
                    <p @click="downvote(post)"
                        class="vote is-size-6 has-text-centered has-text-weight-bold has-text-danger">{{
                        formatNumber(post.votes?.downvotes.length)
                        }}</p>
                </div>
            </div>
            <div class="media-content">
                <div class="post-title box m-0 is-shadowless has-background-light p-2"
                    @click="navigateTo(`/posts/${post.post_id}`)">
                    <p class="title is-5 has-text-weight-semibold m-0">{{ post.title }}</p>
                </div>
                <div class="pills">
                    <p class="tag topic is-light is-link" v-for="topic in post?.topics"
                        @click="navigateTo(`/topic/${topic}`)">{{ topic }}</p>
                    <p class="tag user-profile is-light is-primary"
                        @click="navigateTo(`/profile/${post.user?.username}`)">u/{{
                        post.user?.username }}</p>
                    <p class="tag is-light is-info ">{{ timeSince(post.time) }}</p>
                </div>
            </div>
        </div>
        <div class="box m-0 p-2 pagination is-small is-centered" role="navigation">
            <a class="pagination-previous is-disabled" title="This is the first page">Previous</a>
            <a class="pagination-next">Next page</a>
            <ul class="pagination-list">
                <li><a class="pagination-link is-current">1</a></li>
                <li><a class="pagination-link">2</a></li>
                <li><a class="pagination-link">3</a></li>
                <li><span class="pagination-ellipsis">&hellip;</span></li>
                <li><a class="pagination-link">99</a></li>
            </ul>
        </div>
    </div>
    <div class="box content m-5" v-else>
        <i>There are no posts yet...</i>
    </div>
</template>


<style scoped lang="scss">
@import '../../styles/global.scss';

.post {
    padding: 0.25em;
    margin-bottom: 0.25em;
}

.media-left {
    width: 2em;
}

.votes-left {
    display: flex;
    flex-direction: column;

    p {
        line-height: 24px;
    }

    p:hover {
        cursor: pointer;
        background-color: lightgray;
        border-radius: 2px;
    }
}

.post-title:hover {
    cursor: pointer;
}

.media-content {
    align-self: center;
}

.pills {
    gap: 0.25em;
    @include flex-hw;

    margin-top: 0.25em;

    .tag {
        flex: 1 1 0;
        padding: 0.2em 1em;
    }
}

.topic {
    cursor: pointer;
}

.user-profile:hover {
    cursor: pointer;
}
</style>