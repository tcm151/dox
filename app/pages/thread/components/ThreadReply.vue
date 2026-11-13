<script setup lang="ts">
import type { Thread } from '@@/shared/types'
import { useSlowMode } from '@@/app/utils/slow'
import { watch } from 'vue'

const props = defineProps<{
    thread: Thread
    active?: boolean
}>()

const hints = useHints()
const session = getSession()
const slowMode = useSlowMode()

const replyState = slowMode.submissionState(() => props.thread)
const replyText = ref("")
const replyTags = ref<string[]>([])
const submitting = ref(false)

const emit = defineEmits<{
    (event: 'reply'): void
    (event: 'cancel'): void
    (event: 'updated'): void
    (event: 'submitting', value: boolean): void
}>()

watch(() => props.active, (active) => {
    if (!active) resetReply()
})

function resetReply() {
    replyText.value = ""
    replyTags.value = []
}

function toggleReply() {
    if (!session.isAuthenticated) {
        hints.addWarning("You must be logged in to interact with others.")
        return
    }
    if (replyState.value.disabled) {
        if (replyState.value.warning) hints.addWarning(replyState.value.warning)
        return
    }

    emit('reply')
}

function cancelReply() {
    resetReply()
    emit('cancel')
}

async function submitReply() {
    if (submitting.value) return
    if (!session.isAuthenticated) {
        hints.addWarning("You must be logged in to interact with others.")
        return
    }
    if (replyState.value.disabled) {
        if (replyState.value.warning) hints.addWarning(replyState.value.warning)
        return
    }

    submitting.value = true
    emit('submitting', true)
    try {
        await useApi<Thread>(`/api/thread/${extractId(props.thread.id)}/reply`, {
            body: { content: replyText.value, tags: replyTags.value },
        })
        slowMode.recordSubmission(props.thread.id)
        cancelReply()
        emit('updated')
    }
    catch (error: any) {
        const status = error?.statusCode ?? error?.response?.status
        if (status === 409 || status === 429) hints.addWarning(error.message)
        else hints.addError(error.message, error)
    }
    finally {
        submitting.value = false
        emit('submitting', false)
    }
}
</script>
<template>
    <section class="column g-2">
        <div class="row wrap g-1">
            <Votes :target="thread" />
            <div class="row wrap f-1 g-1">
                <UserTag :user="thread.user" />
                <DurationTag :time="thread.time" />
                <Tag type="meta" icon="fa-comment" :label="thread.replies.length.toString()" />
                <Tag type="meta" icon="fa-chart-simple" :label="thread.visits" />
                <Tag v-if="thread.timeEdited" class="f-1" type="danger" icon="fa-eraser" :label="formatDate(thread.timeEdited)" />
                <button v-if="!thread.deleted" type="button" class="meta tag" :disabled="replyState.disabled" @click="toggleReply">
                    <i class="fa-solid fa-reply"></i>
                    <span>Reply</span>
                </button>
                <!-- <Tag type="meta" icon="fa-right-to-bracket" @click="navigateTo(`/thread/${extractId(thread.id)}`)" /> -->
                <ModerationState :moderation="thread.moderation" content-type="thread" />
            </div>
        </div>
        <ContentVisibility :tags="thread.tags" direct>
            <Markdown compact class="content preview" :content="thread.content" />
        </ContentVisibility>
        <p v-if="!active && replyState.warning" class="warning mt-2" role="status">{{ replyState.warning }}</p>
        <ReplyComposer v-if="active"
            show-content-tags
            class="pb-3"
            autofocus
            :submitting="submitting"
            submit-label="Reply"
            submit-icon="fa-reply"
            :disabled="replyState.disabled"
            :warning="replyState.warning"
            v-model:tags="replyTags"
            @submit="submitReply"
            @cancel="cancelReply"
            v-model="replyText"
        />
    </section>
</template>

<style scoped lang="scss">

.reply-action {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
}

</style>