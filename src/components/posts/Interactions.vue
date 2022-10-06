<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { Post } from '../../api/types';
import { GetSession } from '../../services/store.new';
import CommentBox from './CommentBox.vue'

const session = GetSession();

const props = defineProps<{ post: Post | undefined }>();
defineEmits(['toggleCommentBox', 'postComment'])

const showCommentBox = ref(false);

const toggleModal = inject("toggleModal") as Function;

function isOwner() {
    if (session.isAuthenticated && session.User?.user_id == props.post?.user?.user_id) {
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
    <div class="interactions mt-2" v-if="session.isAuthenticated">
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

<style scoped lang="scss">
@import '../../styles/global.scss';

.buttons {
    button {
        font-weight: 500;
    }
}
</style>