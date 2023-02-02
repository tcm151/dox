<script setup lang="ts">
import { ref } from "vue";
import { Comment } from "~/types/types";

const props = defineProps<{
    comments: Comment[],
    replies: Comment[]
}>()

const emit = defineEmits(['submitComment']);

const vote = useVoting();

const commentReply = ref<string>("");
const replyToComment = ref<string>("end");

function getReplies(originalComment: Comment) {
    return props.comments.filter(c => c.replyTo === originalComment.id);
}

function toggleReply(comment: Comment) {
    replyToComment.value = (comment.id === replyToComment.value) ? "end" : comment.id;
    commentReply.value = "";
}

function submitComment(comment: Comment) {
    emit('submitComment', { comment: commentReply.value, replyTo: comment.id });
    toggleReply(comment);
}

</script>

<template>
    <div class="comment-list" v-if="replies.length > 0">
        <div class="comment" v-for="comment in replies" :key="comment.id">
            <div class="comment-line"></div>
            <div class="real">
                <div class="header">
                    <div class="votes">
                        <p class="vote tag is-light is-success" @click="vote.upvote(comment.votes)">{{
                        comment.votes.upvotes.length
                        }}</p>
                        <p class="vote tag is-light is-warning" @click="vote.misleading(comment.votes)">{{
                        comment.votes.misleading.length
                        }}</p>
                        <p class="vote tag is-light is-danger" @click="vote.downvote(comment.votes)">{{
                        comment.votes.downvotes.length
                        }}</p>
                    </div>
                    <Tag :label="`u/${comment.user?.name}`" class="is-light is-primary"
                         :route="`/profile/${comment.user?.name}`" />
                    <p class="tag is-light is-info">{{ comment.time }}</p>
                    <p class="tag reply-button" @click="toggleReply(comment)">Reply</p>
                </div>
                <div class="body">
                    <!-- <div class="comment-line"></div> -->
                    <p>{{ comment.content }}</p>
                </div>
                <div class="comment-reply" v-if="replyToComment === comment.id">
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