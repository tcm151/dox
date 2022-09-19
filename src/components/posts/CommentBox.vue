<script setup lang="ts">
import { ref } from 'vue';

// defineProps<{}>();
defineEmits(['toggleCommentBox', 'postComment'])

const comment = ref("");

</script>

<template>
    <form class="fields">
        <div class="field">
            <div class="control">
                <textarea class="textarea" rows="5" v-model="comment"></textarea>
            </div>
        </div>
        <div class="field buttons is-grouped">
            <div class="control">
                <button class="button is-primary" @click.prevent="$emit('postComment', comment)">Submit</button>
                <button class="button is-danger" @click="$emit('toggleCommentBox')">Cancel</button>
            </div>
        </div>
    </form>
</template>