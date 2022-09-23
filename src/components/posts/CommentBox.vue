<script setup lang="ts">
import { ref } from 'vue';

// defineProps<{}>();
const emit = defineEmits(['toggleCommentBox', 'postComment'])

const comment = ref("");

function postComment(comment: string, replyTo: number | null) {
    emit('postComment', { comment: comment, replyTo: replyTo })
    emit('toggleCommentBox')
}

</script>

<template>
    <form class="fields">
        <div class="field">
            <div class="control">
                <textarea class="textarea" rows="4" v-model="comment"></textarea>
            </div>
        </div>
        <div class="field buttons is-grouped">
            <div class="control">
                <button class="button is-primary" @click.prevent="postComment(comment, null)">Submit</button>
                <button class="button is-danger" @click="$emit('toggleCommentBox')">Cancel</button>
            </div>
        </div>
    </form>
</template>