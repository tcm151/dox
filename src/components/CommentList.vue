<template>
    <div class="box m-5" v-if="comments.length > 0">
        <div class="block content" v-for="comment in comments" :key="comment.comment_id">
            <h5>{{ comment.user?.username }}</h5>
            <p>{{ comment.content }}</p>
        </div>
    </div>
    <div class="box content m-5" v-else>
        <i>There are no comments yet...</i>
    </div>
</template>

<script setup lang="ts">
import { Comment } from "../api/types"

defineProps<{
    comments: Comment[]
}>()

</script>