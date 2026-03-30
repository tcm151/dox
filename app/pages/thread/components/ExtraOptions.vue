<script setup lang="ts">
import type { Thread } from '@@/shared/types'

const session = getSession()

const props = defineProps<{
    thread: Thread
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
    emit(event as any)
    emit('close')
}
</script>

<template>
    <Window title="Options" icon="fa-solid fa-list-ul" width="20rem" @close="emit('close')">
        <section class="column g-2">
            <button v-if="thread.user.id === session.user.id" @click="emitAndClose('edit')">
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
            <!-- <button v-if="hasRole(session.user, 'admin')" @click="emitAndClose('archive')">
                <i class="fa-solid fa-box"></i>
                <span v-if="!thread.archived">Archive</span>
                <span v-else>Unarchive</span>
            </button> -->
            <button v-if="thread.user.id === session.user.id" @click="emitAndClose('delete')">
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