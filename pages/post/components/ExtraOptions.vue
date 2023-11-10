<script setup lang="ts">
import type { Post, User } from '~/types'

const session = getSession()

const props = defineProps<{
    visible: boolean
    post: Post
}>()

const emit = defineEmits<{
    (event: 'pinPost'): void
    (event: 'awardPost'): void
    (event: 'savePost'): void
    (event: 'reportPost'): void
    (event: 'editPost'): void
    (event: 'deletePost'): void
    (event: 'close'): void
}>()
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
            <button v-if="session.user.admin" class="pin" @click="() => {
                emit('pinPost')
                emit('close')
            }">
                <i class="fa-solid fa-thumbtack"></i>
                Pin
            </button>
            
            <button class="save" @click="() => {
                emit('savePost')
                emit('close')
            }">
                <i class="fa-solid fa-box-archive"></i>
                <span>Save</span>
            </button>
            
            <button class="award" @click="() => {
                emit('awardPost')
                emit('close')
            }">
                <i class="fa-solid fa-crown"></i>
                <span>Award</span>
            </button>
            
            <button class="report" @click="() => {
                emit('reportPost')
                emit('close')
            }">
                <i class="fa-solid fa-flag"></i>
                <span>Report</span>
            </button>
            
            <button v-if="(post.user as User).id === session.user.id" class="edit" @click="() => {
                emit('editPost')
                emit('close')
            }">
                <i class="fa-solid fa-eraser"></i>
                <span>Edit</span>
            </button>
            
            <button v-if="(post.user as User).id === session.user.id" class="delete" @click="() => {
                emit('deletePost')
                emit('close')
            }">
                <i class="fa-solid fa-trash-can"></i>
                <span>Delete</span>
            </button>
        </section>
    </Window>
</template>

<style scoped lang="scss">
</style>