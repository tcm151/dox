<script setup lang="ts">
import type { Post, User } from '~/types'

const session = getSession()

const props = defineProps<{
    visible: boolean
    post: Post
}>()

const emit = defineEmits<{
    (event: 'awardPost'): void
    (event: 'savePost'): void
    (event: 'reportPost'): void
    (event: 'editPost'): void
    (event: 'deletePost'): void
    (event: 'close'): void
}>()

function savePost() {
    emit('savePost')
    emit('close')
}

function awardPost() {
    emit('awardPost')
    emit('close')
}

function reportPost() {
    emit('reportPost')
    emit('close')
}

function editPost() {
    emit('editPost')
    emit('close')
}

function deletePost() {
    emit('deletePost')
    emit('close')
}

</script>

<template>
    <Window
        :visible="visible"
        width="250px"
        title="Options"
        icon="fa-solid fa-list-ul"
        @close="emit('close')"
    >
        <section class="column g-2">
            <button class="save" @click="savePost">
                <i class="fa-solid fa-box-archive"></i>
                <span>Save</span>
            </button>
            <button class="award" @click="awardPost">
                <i class="fa-solid fa-crown"></i>
                <span>Award</span>
            </button>
            <button class="report" @click="reportPost">
                <i class="fa-solid fa-flag"></i>
                <span>Report</span>
            </button>
            <button v-if="(post.user as User).id === session.user?.id" class="edit" @click="editPost">
                <i class="fa-solid fa-eraser"></i>
                <span>Edit</span>
            </button>
            <button v-if="(post.user as User).id === session.user?.id" class="delete" @click="deletePost">
                <i class="fa-solid fa-trash-can"></i>
                <span>Delete</span>
            </button>
        </section>
    </Window>
</template>

<style scoped lang="scss">
</style>