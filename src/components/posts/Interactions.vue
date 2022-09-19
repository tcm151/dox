<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { Post } from '../../api/types';
import { store } from '../../services/store';
import CommentBox from './CommentBox.vue'

const props = defineProps<{ post: Post | undefined }>();
defineEmits(['toggleCommentBox', 'postComment'])

const session = computed(() => store.state.session)
const showCommentBox = ref(false);

const toggleModal = inject("toggleModal") as Function;

function isOwner() {
    if (session.value.authenticated && session.value.user?.user_id == props.post?.user?.user_id) {
        return true;
    }
    return false;
}

function toggleCommentBox() {
    showCommentBox.value = !showCommentBox.value;
}

function editPost(post: Post) {
    toggleModal("Editing existing posts is currently not supported", "ETA: soon!");
}


</script>

<template>
    <div v-if="session.authenticated">
        <div class="field is-grouped" v-if="!showCommentBox">
            <div class="buttons">
                <button class="button is-light is-primary" @click="toggleCommentBox">Comment</button>
                <button class="button is-light is-info" @click="">Share</button>
                <button class="button is-light is-danger" @click="">Report</button>
                <button class="button is-light is-link" v-if="isOwner()" @click="editPost(post!)">Edit</button>
            </div>
        </div>
        <CommentBox v-if="showCommentBox" @toggle-comment-box="toggleCommentBox"
            @post-comment="$emit('postComment', $event)" />
    </div>
    <div v-else class="box has-background-danger has-text-weight-semibold">
        <p>You must be logged in to participate</p>
    </div>
</template>