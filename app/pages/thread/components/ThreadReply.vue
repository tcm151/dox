<script setup lang="ts">
import type { Thread } from '@@/shared/types'
import { useSlowMode } from '@@/app/utils/slow'

const hints = useHints()
const session = getSession()
const slowMode = useSlowMode()

const props = defineProps<{
    thread: Thread
    chainItems?: Thread[]
}>()

const emit = defineEmits<{
    (event: 'reply'): void
}>()

const replyingTo = ref<string>()
const replyText = ref("")
const replyTags = ref<string[]>([])
const submitting = ref(false)
const replyStates = slowMode.submissionStates(
    () => [props.thread, ...(props.chainItems ?? [])],
)

function isThreadLoadMore(item: Thread): boolean {
    return item.id === "thread:load_more"
}

function toggleReply(target: Thread) {
    if (!session.isAuthenticated) {
        hints.addWarning("You must be logged in to interact with others.")
        return
    }
    const state = replyStates.value[target.id]
    if (state?.disabled) {
        if (state.warning) hints.addWarning(state.warning)
        return
    }

    if (replyingTo.value === target.id) {
        cancelReply()
    }
    else {
        replyingTo.value = target.id
        replyText.value = ""
        replyTags.value = []
    }
}

function cancelReply() {
    replyingTo.value = undefined
    replyText.value = ""
    replyTags.value = []
}

async function submitReply(target: Thread) {
    if (submitting.value) return
    if (!session.isAuthenticated) {
        hints.addWarning("You must be logged in to interact with others.")
        return
    }
    const state = replyStates.value[target.id]
    if (state?.disabled) {
        if (state.warning) hints.addWarning(state.warning)
        return
    }

    submitting.value = true
    try {
        await useApi<Thread>(`/api/thread/${extractId(target.id)}/reply`, {
            body: { content: replyText.value, tags: replyTags.value },
        })
        slowMode.recordSubmission(target.id)
        cancelReply()
        emit("reply")
    }
    catch (error: any) {
        const status = error?.statusCode ?? error?.response?.status
        if (status === 409 || status === 429) hints.addWarning(error.message)
        else hints.addError(error.message, error)
    }
    finally {
        submitting.value = false
    }
}

</script>

<template>
    <div class="thread box row hover-shadow">
        <aside class="indent-line br-small ml-4 my-4" />
        <div class="main column f-1 px-4 pt-4">
            <section>
                <div class="row wrap g-1">
                    <Votes :target="thread" />
                    <div class="row wrap f-1 g-1">
                        <UserTag :user="thread.user" />
                        <Tag type="info" icon="fa-chart-simple" :label="thread.visits" />
                        <Tag type="info" icon="fa-comment" :label="thread.replies.length.toString()" />
                        <DurationTag :time="thread.time" />
                        <ModerationState :moderation="thread.moderation" content-type="thread" />
                        <button v-if="!thread.deleted" type="button" class="link small reply-action" :disabled="replyStates[thread.id]?.disabled" @click="toggleReply(thread)">
                            <i class="fa-solid fa-reply"></i>
                            <span>Reply</span>
                        </button>
                        <Tag type="link" icon="fa-right-to-bracket" @click="navigateTo(`/thread/${extractId(thread.id)}`)" />
                    </div>
                </div>
                <ContentVisibility :tags="thread.tags" direct>
                    <Markdown class="content preview" :content="thread.content" />
                </ContentVisibility>
                <p v-if="replyingTo !== thread.id && replyStates[thread.id]?.warning" class="warning mt-2" role="status">{{ replyStates[thread.id]?.warning }}</p>
                <ReplyComposer
                    v-if="replyingTo === thread.id"
                    show-content-tags
                    class="pb-3"
                    autofocus
                    :submitting="submitting"
                    submit-label="Reply"
                    submit-icon="fa-reply"
                    :disabled="replyStates[thread.id]?.disabled"
                    :warning="replyStates[thread.id]?.warning"
                    v-model:tags="replyTags"
                    @submit="submitReply(thread)"
                    @cancel="cancelReply"
                    v-model="replyText"
                />
            </section>
            <template v-if="chainItems">
                <template v-for="reply in chainItems" :key="reply.id">
                    <Tag v-if="isThreadLoadMore(reply)" class="dark mb-3" icon="fa-ellipsis" label="More replies omitted" />
                    <section v-else>
                        <div class="row wrap g-1">
                            <Votes :target="reply" />
                            <div class="row wrap f-1 g-1">
                                <UserTag :user="reply.user" />
                                <Tag type="info" icon="fa-chart-simple" :label="reply.visits" />
                                <Tag type="info" icon="fa-comment" :label="reply.replies.length.toString()" />
                                <DurationTag :time="reply.time" />
                                <Tag v-if="reply.timeEdited" class="f-1" type="danger" icon="fa-eraser" :label="formatDate(reply.timeEdited)" />
                                <ModerationState :moderation="reply.moderation" content-type="thread" />
                                <button v-if="!reply.deleted" type="button" class="link small reply-action" :disabled="replyStates[reply.id]?.disabled" @click="toggleReply(reply)">
                                    <i class="fa-solid fa-reply"></i>
                                    <span>Reply</span>
                                </button>
                                <Tag v-if="!reply.deleted" type="link" icon="fa-right-to-bracket" @click="navigateTo(`/thread/${extractId(reply.id)}`)" />
                            </div>
                        </div>
                        <ContentVisibility :tags="reply.tags" direct>
                            <Markdown class="content preview" :content="reply.content" />
                        </ContentVisibility>
                        <p v-if="replyingTo !== reply.id && replyStates[reply.id]?.warning" class="warning mt-2" role="status">{{ replyStates[reply.id]?.warning }}</p>
                        <ReplyComposer
                            v-if="replyingTo === reply.id"
                            show-content-tags
                            class="pb-3"
                            autofocus
                            :submitting="submitting"
                            submit-label="Reply"
                            submit-icon="fa-reply"
                            :disabled="replyStates[reply.id]?.disabled"
                            :warning="replyStates[reply.id]?.warning"
                            v-model:tags="replyTags"
                            @submit="submitReply(reply)"
                            @cancel="cancelReply"
                            v-model="replyText"
                        />
                    </section>
                </template>
            </template>
        </div>
    </div>
</template>

<style scoped lang="scss">

.thread {
    .indent-line {
        background-color: $white-1;
        flex: 0 0 8px;
    }

    .indent-line:hover {
        background-color: $white-2;
    }
    
    .main {
        overflow: hidden;
    }
}

.reply-action {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
}

</style>