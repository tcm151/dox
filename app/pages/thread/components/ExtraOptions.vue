<script setup lang="ts">
import type { Thread } from '@@/shared/types'

const session = getSession()

const props = defineProps<{
    thread: Thread
}>()

const emit = defineEmits<{
    (event: 'edit'): void
    (event: 'award'): void
    (event: 'report'): void
    (event: 'delete'): void
    (event: 'archive'): void
    (event: 'pin'): void
    (event: 'close'): void
    (event: 'updated'): void
}>()

const actions = {
    edit: () => emit('edit'),
    award: () => emit('award'),
    report: () => emit('report'),
    delete: () => emit('delete'),
    pin: () => emit('pin'),
}

function emitAndClose(event: keyof typeof actions) {
    actions[event]()
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
            <button @click="emitAndClose('award')">
                <i class="fa-solid fa-crown"></i>
                <span>Award</span>
            </button>
            <button class="report" @click="emitAndClose('report')">
                <i class="fa-solid fa-flag"></i>
                <span>Report</span>
            </button>
            <template v-if="hasRole(session.user, ['admin', 'developer'])">
                <button v-if="thread.status === 'active'" class="dark" @click="emit('archive')">
                    <i class="fa-solid fa-box-archive"></i>
                    <span>Archive</span>
                </button>
                <button v-else-if="thread.status === 'archived'" class="dark" @click="emit('archive')">
                    <i class="fa-solid fa-box-open"></i>
                    <span>Unarchive</span>
                </button>
            </template>
            <button v-if="thread.user.id === session.user.id" @click="emitAndClose('delete')">
                <i class="fa-solid fa-trash-can"></i>
                <span>Delete</span>
            </button>
            <button v-if="hasRole(session.user, ['admin', 'developer'])" @click="emitAndClose('pin')">
                <i class="fa-solid fa-thumbtack"></i>
                <span>Pin</span>
            </button>
            <ModerationControls :id="thread.id" @updated="emit('updated')" />
        </section>
    </Window>
</template>

<style scoped lang="scss">
</style>