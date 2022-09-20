<script setup lang="ts">
import axios from "axios";
import { inject } from "vue";
import { Comment } from "../../api/types"
import { timeSince } from "../../services/dateTime";
import { store } from "../../services/store";

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

    axios.patch(`https://doxforeverything.herokuapp.com/comments/${comment.comment_id}/votes`, new URLSearchParams({ votes: JSON.stringify(comment.votes) }))
}

function misleading(comment: Comment) {
    if (!store.state.session.authenticated) {
        toggleModal("You must be logged in to vote", "Please login or create an account to interact with others")
        return;
    }

    if (comment.votes.upvotes.includes(store.getters.getCurrentUserId)) comment.votes.upvotes = comment.votes.upvotes.filter(id => id !== store.getters.getCurrentUserId)
    if (!comment.votes.misleading.includes(store.getters.getCurrentUserId)) comment.votes.misleading.push(store.getters.getCurrentUserId)
    if (comment.votes.downvotes.includes(store.getters.getCurrentUserId)) comment.votes.downvotes = comment.votes.downvotes.filter(id => id !== store.getters.getCurrentUserId)

    axios.patch(`https://doxforeverything.herokuapp.com/comments/${comment.comment_id}/votes`, new URLSearchParams({ votes: JSON.stringify(comment.votes) }))
}
function downvote(comment: Comment) {
    if (!store.state.session.authenticated) {
        toggleModal("You must be logged in to vote", "Please login or create an account to interact with others")
        return;
    }

    if (comment.votes.upvotes.includes(store.getters.getCurrentUserId)) comment.votes.upvotes = comment.votes.upvotes.filter(id => id !== store.getters.getCurrentUserId)
    if (comment.votes.misleading.includes(store.getters.getCurrentUserId)) comment.votes.misleading = comment.votes.misleading.filter(id => id !== store.getters.getCurrentUserId)
    if (!comment.votes.downvotes.includes(store.getters.getCurrentUserId)) comment.votes.downvotes.push(store.getters.getCurrentUserId)

    axios.patch(`https://doxforeverything.herokuapp.com/comments/${comment.comment_id}/votes`, new URLSearchParams({ votes: JSON.stringify(comment.votes) }))
}

</script>

<template>
    <div class="comment-list" v-if="comments.length > 0">
        <div class="comment" v-for="comment in comments" :key="comment.comment_id">
            <div class="header">
                <div class="votes">
                    <p class="vote tag is-light is-success" @click.prevent="upvote(comment)">{{
                    comment.votes.upvotes.length
                    }}</p>
                    <p class="vote tag is-light is-warning" @click.prevent="misleading(comment)">{{
                    comment.votes.misleading.length
                    }}</p>
                    <p class="vote tag is-light is-danger" @click.prevent="downvote(comment)">{{
                    comment.votes.downvotes.length
                    }}</p>
                    <p class="tag is-light is-info">{{ timeSince(comment.time) }}</p>
                    <p class="tag is-light is-link">u/{{ comment.user?.username }}</p>
                    <p class="tag reply-button">Reply</p>
                </div>
            </div>
            <div class="body">
                <div class="comment-line"></div>
                <p>{{ comment.content }}</p>
            </div>
        </div>
    </div>
    <div class="box content m-5" v-else>
        <i>There are no comments yet...</i>
    </div>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.comment-list {
    border-right: 2px ghostwhite solid;
    border-bottom: 2px ghostwhite solid;

    border-radius: 0.25em;
}

.comment {
    @include flex-v;

    .header {
        @include flex-h;

        padding: 0.25em;
        font-weight: 500;
        background-color: ghostwhite;

        .votes {
            @include flex-h;
            gap: 0.25em;

            .vote:hover,
            .reply-button:hover {
                filter: brightness(0.95)
            }

            p {
                font-weight: 600;
                font-size: 0.8em;
            }
        }
    }


    .body {
        @include flex-h;
        gap: 0.5em;


        .comment-line {
            width: 0.25em;
            background-color: ghostwhite;
        }

        p {
            padding: 0.25em;
            font-weight: 500;
            font-size: 1em;
        }
    }
}
</style>