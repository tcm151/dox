<template>
    <div v-if="comments.length > 0">
        <div class="block my-3" v-for="comment in comments" :key="comment.comment_id">
            <div class="card">
                <div class="card-header level-left is-shadowless has-background-grey-lighter">
                    <p class="card-header-title level-item m-0">u/{{ comment.user?.username }}</p>
                    <div class="tags">
                        <p class="level-item tag is-light is-success">{{ comment.votes.upvotes }}</p>
                        <p class="level-item tag is-light is-warning">{{ comment.votes.misleading }}</p>
                        <p class="level-item tag is-light is-danger">{{ comment.votes.downvotes }}</p>
                        <p class="level-item tag is-light is-info">{{ timeSince(comment.time) }}</p>
                    </div>
                </div>
                <div class="message-body">
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