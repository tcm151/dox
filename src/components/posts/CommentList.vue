<script setup lang="ts">
import axios from "axios";
import { inject, ref } from "vue";
import { Comment } from "../../api/types"
import { timeSince } from "../../services/dateTime";
import { GetSession } from "../../services/store.new";
import Tag from "../utilities/Tag.vue";
import CommentBox from "./CommentBox.vue";

const session = GetSession();

const props = defineProps<{ comments: Comment[], replies: Comment[] }>()
const emit = defineEmits(['submitComment']);

const toggleModal = inject("toggleModal") as Function

const commentReply = ref<string>("");
const replyToComment = ref<number>(-1);

function upvote(comment: Comment) {
    if (!session.isAuthenticated) {
        toggleModal("You must be logged in to vote", "Please login or create an account to interact with others")
        return;
    }

    if (!comment.votes.upvotes.includes(session.User!.user_id)) comment.votes.upvotes.push(session.User!.user_id)
    if (comment.votes.misleading.includes(session.User!.user_id)) comment.votes.misleading = comment.votes.misleading.filter(id => id !== session.User?.user_id)
    if (comment.votes.downvotes.includes(session.User!.user_id)) comment.votes.downvotes = comment.votes.downvotes.filter(id => id !== session.User?.user_id)

    axios.patch(`https://www.tcmdev.ca/comments/${comment.comment_id}/votes`, new URLSearchParams({ votes: JSON.stringify(comment.votes) }))
}

function misleading(comment: Comment) {
    if (!session.isAuthenticated) {
        toggleModal("You must be logged in to vote", "Please login or create an account to interact with others")
        return;
    }

    if (comment.votes.upvotes.includes(session.User!.user_id)) comment.votes.upvotes = comment.votes.upvotes.filter(id => id !== session.User?.user_id)
    if (!comment.votes.misleading.includes(session.User!.user_id)) comment.votes.misleading.push(session.User!.user_id)
    if (comment.votes.downvotes.includes(session.User!.user_id)) comment.votes.downvotes = comment.votes.downvotes.filter(id => id !== session.User?.user_id)

    axios.patch(`https://www.tcmdev.ca/comments/${comment.comment_id}/votes`, new URLSearchParams({ votes: JSON.stringify(comment.votes) }))
}

function downvote(comment: Comment) {
    if (!session.isAuthenticated) {
        toggleModal("You must be logged in to vote", "Please login or create an account to interact with others")
        return;
    }

    if (comment.votes.upvotes.includes(session.User!.user_id)) comment.votes.upvotes = comment.votes.upvotes.filter(id => id !== session.User?.user_id)
    if (comment.votes.misleading.includes(session.User!.user_id)) comment.votes.misleading = comment.votes.misleading.filter(id => id !== session.User?.user_id)
    if (!comment.votes.downvotes.includes(session.User!.user_id)) comment.votes.downvotes.push(session.User!.user_id)

    axios.patch(`https://www.tcmdev.ca/comments/${comment.comment_id}/votes`, new URLSearchParams({ votes: JSON.stringify(comment.votes) }))
}

function getReplies(originalComment: Comment) {
    return props.comments.filter(c => c.reply_to === originalComment.comment_id);
}

function toggleReply(comment: Comment) {
    if (comment.comment_id === replyToComment.value) {
        replyToComment.value = -1;
    }
    else {
        replyToComment.value = comment.comment_id;
    }
    commentReply.value = "";
}

function submitComment(comment: Comment) {
    emit('submitComment', { comment: commentReply.value, replyTo: comment.comment_id });
    toggleReply(comment);
}

</script>

<template>
    <div class="comment-list" v-if="replies.length > 0">
        <div class="comment" v-for="comment in replies" :key="comment.comment_id">
            <div class="comment-line"></div>
            <div class="real">
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
                    </div>
                    <Tag :label="`u/${comment.user?.username}`" class="is-light is-primary"
                         :route="`/profile/${comment.user?.username}`" />
                    <p class="tag is-light is-info">{{ timeSince(comment.time) }}</p>
                    <p class="tag reply-button" @click="toggleReply(comment)">Reply</p>
                </div>
                <div class="body">
                    <!-- <div class="comment-line"></div> -->
                    <p>{{ comment.content }}</p>
                </div>
                <div class="comment-reply" v-if="replyToComment === comment.comment_id">
                    <textarea class="textarea" rows="2" v-model="commentReply"></textarea>
                    <div class="comment-reply-buttons">
                        <button class="button tag is-success" @click="submitComment(comment)">Submit</button>
                        <button class="button tag is-danger" @click="toggleReply(comment)">Cancel</button>
                    </div>
                </div>
                <div class="replies">
                    <!-- <div class="comment-line"></div> -->
                    <CommentList v-if="getReplies(comment).length > 0" :comments="comments"
                                 :replies="getReplies(comment)" @submit-comment="$emit('submitComment', $event)" />
                </div>
            </div>
        </div>
    </div>
    <div class="box content my-1 has-background-light is-shadowless" v-else>
        <i>There are no comments yet...</i>
    </div>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.comment-list {
    // border-radius: 0.25em;
    // border-right: 2px $dox-grey solid;
    // border-bottom: 2px $dox-grey solid;

    .comment-line {
        width: 0.25em;
        background-color: $white-ter;
    }

    .real {
        flex: 1 1;
    }
}

.comment {
    @include flex-h;

    .comment-line {
        width: 0.25em;
        background-color: $white-ter;

        border-radius: 0.5em 0 0.25em 0.25em;
    }

    .real {
        @include flex-v;
    }
}

.header {
    @include flex-hw;
    // gap: 0.25em;

    border-radius: 0 0.25em 0.25em 0;
    // padding: 0.25em;
    font-weight: 500;
    background-color: $white-ter;

    .votes {
        @include flex-h;
        // gap: 0.25em;
    }

    .vote:hover,
    .reply-button:hover {
        cursor: pointer;
        filter: brightness(0.95)
    }

    p {
        font-weight: 600;
        font-size: 0.8em;
    }
}


.body {
    p {
        flex: 1 1;

        padding: 0.5em;
        font-size: 1em;
        font-weight: 500;

        // text-align: justify;
        // hyphens: auto;
        // word-wrap: break-word;
        // overflow-wrap: break-word;
    }
}

.comment-reply {
    @include flex-v (0.5em);
    padding: 0 0.5em 0.5em 0.5em;

    .comment-reply-buttons {
        @include flex-h (0.5em);

        .tag {
            font-weight: 600;
        }
    }
}

.replies {
    margin-left: 1.5em;
}
</style>