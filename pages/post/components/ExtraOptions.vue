<script setup lang="ts">
import type { Post, User } from '~/types'

const session = getSession()

const props = defineProps<{
    visible: boolean
    post: Post
}>()

const emit = defineEmits<{
    (event: 'edit'): void
    (event: 'save'): void
    (event: 'award'): void
    (event: 'report'): void
    (event: 'delete'): void
    (event: 'archive'): void
    (event: 'pin'): void
    (event: 'close'): void
}>()

function emitAndClose(event: string) {
    emit(event)
    emit('close')
}
</script>

<template>
    <Window
        :visible="visible"
        width="20rem"
        title="Options"
        icon="fa-solid fa-list-ul"
        @close="emit('close')"
    >
        <section class="column g-2">
            <button v-if="(post.user as User).id === session.user.id" @click="emitAndClose('edit')">
                <i class="fa-solid fa-eraser"></i>
                <span>Edit</span>
            </button>
            <!-- <button class="save" @click="emitAndClose('save')">
                <i class="fa-solid fa-box-archive"></i>
                <span>Save</span>
            </button> -->
            <button class="award" @click="emitAndClose('award')">
                <i class="fa-solid fa-crown"></i>
                <span>Award</span>
            </button>
            <button class="report" @click="emitAndClose('report')">
                <i class="fa-solid fa-flag"></i>
                <span>Report</span>
            </button>
            <button v-if="hasRole(session.user, 'admin')" @click="emitAndClose('archive')">
                <i class="fa-solid fa-box"></i>
                <span v-if="!post.archived">Archive</span>
                <span v-else>Unarchive</span>
            </button>
            <button v-if="(post.user as User).id === session.user.id" @click="emitAndClose('delete')">
                <i class="fa-solid fa-trash-can"></i>
                <span>Delete</span>
            </button>
            <button v-if="hasRole(session.user, 'admin')" @click="emitAndClose('pin')">
                <i class="fa-solid fa-thumbtack"></i>
                <span>Pin</span>
            </button>
        </section>
    </Window>
</template>

<style scoped lang="scss">
</style>