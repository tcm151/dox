<template>
    <div v-if="comments.length > 0">
        <div class="block my-3" v-for="comment in comments" :key="comment.comment_id">
            <div class="card">
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
import moment from "moment";
import { Comment } from "../api/types"

defineProps<{ comments: Comment[] }>()

function timeSince(dateTime: string) {
    return `${moment().diff(dateTime, 'hours')}h ago`
}

</script>