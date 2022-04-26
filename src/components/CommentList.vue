<template>
    <div v-if="comments.length > 0">
        <div class="block my-0" v-for="comment in comments" :key="comment.comment_id">
            <div class="card is-shadowless">
                <div class="card-header is-shadowless has-background-grey-lighter">
                    <p class="card-header-title level-left p-3">u/{{ comment.user?.username }}</p>
                    <div class="level-left tags">
                        <p class="tag is-light is-success">{{ comment.votes.upvotes }}</p>
                        <p class="tag is-light is-warning">{{ comment.votes.misleading }}</p>
                        <p class="tag is-light is-danger">{{ comment.votes.downvotes }}</p>
                        <p class="tag is-light is-info">{{ timeSince(comment.time) }}</p>
                    </div>
                </div>
                <div class="message-body p-2">
                    <p>{{ comment.content }}</p>
                </div>
            </div>
        </div>
    </div>
    <div class="box content m-5" v-else>
        <i>There are no comments yet...</i>
    </div>
</template>

<script setup lang="ts">
// import moment from "moment";
import axios from "axios";
import { inject } from "vue";
import { Comment } from "../api/types"
import { timeSince } from "../services/dateTime";
import { store } from "../services/store";

defineProps<{ comments: Comment[] }>()

const toggleModal = inject("toggleModal") as Function

function upvote(comment: Comment) {
    if (!store.state.session.authenticated) {
        toggleModal("You must be logged in to vote", "Please login or create an account to interact with others")
        return;
    }

    if (!comment.votes.upvotes.includes(store.getters.getCurrentUserId)) comment.votes.upvotes.push(store.getters.getCurrentUserId)
    if (comment.votes.misleading.includes(store.getters.getCurrentUserId)) comment.votes.misleading = comment.votes.misleading.filter(id => id !== store.getters.getCurrentUserId)
    if (comment.votes.downvotes.includes(store.getters.getCurrentUserId)) comment.votes.downvotes = comment.votes.downvotes.filter(id => id !== store.getters.getCurrentUserId)

    axios.patch(`https://doxforeverything.herokuapp.com/posts/${comment.post_id}/votes`, new URLSearchParams({ votes: JSON.stringify(comment.votes) }))
}

function misleading(comment: Comment) {
    if (!store.state.session.authenticated) {
        toggleModal("You must be logged in to vote", "Please login or create an account to interact with others")
        return;
    }

    if (comment.votes.upvotes.includes(store.getters.getCurrentUserId)) comment.votes.upvotes = comment.votes.upvotes.filter(id => id !== store.getters.getCurrentUserId)
    if (!comment.votes.misleading.includes(store.getters.getCurrentUserId)) comment.votes.misleading.push(store.getters.getCurrentUserId)
    if (comment.votes.downvotes.includes(store.getters.getCurrentUserId)) comment.votes.downvotes = comment.votes.downvotes.filter(id => id !== store.getters.getCurrentUserId)

    axios.patch(`https://doxforeverything.herokuapp.com/posts/${comment.post_id}/votes`, new URLSearchParams({ votes: JSON.stringify(comment.votes) }))
}
function downvote(post: Comment) {
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