<script setup lang="ts">
import type { Comment, Post, Gallery } from '@@/shared/types';

const hints = useHints()
const session = getSession()
const slowMode = useSlowMode()

const props = defineProps<{
    comment: Comment
    discussion: Post | Gallery
    editing: boolean
}>()

const emit = defineEmits<{
    (event: 'refresh'): void
    (event: 'options', comment: Comment): void
    (event: 'finish-edit'): void
}>()

let replyText = ref("")
let replyTo = ref(false)
let submitting = ref(false)

function replyToComment() {
    const state = replyState.value
    if (state.disabled) {
        if (state.warning) hints.addWarning(state.warning)
        return
    }
    replyTo.value = true
}

function cancelComment() {
    replyTo.value = false
    replyText.value = ""
}

const replyState = slowMode.submissionState(
    () => props.discussion,
    {
        additionalLocks: () => [props.comment],
    },
)

async function updateComment(comment: Comment) {
    try {
        await useApi(`/api/comment/${extractId(comment.id)}/edit`, {
            body: {
                content: comment.content,
            }
        })
        emit("finish-edit")
        emit("refresh")
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
}

async function submitComment(replyId: Post | Gallery | Comment, content: string) {
    if (submitting.value) return
    if (!session.isAuthenticated) {
        hints.addWarning("You must be logged in to interact with others.")
        return
    }
    const state = replyState.value
    if (state.disabled) {
        if (state.warning) hints.addWarning(state.warning)
        return
    }
    submitting.value = true
    try {
        await useApi<Comment>("/api/comment/add", {
            body: {
                time: new Date(),
                user: session.user.id,
                context: props.comment.context,
                replyTo: replyId.id,
                content: content,
                votes: {
                    positive: [session.user.id],
                    misleading: [],
                    negative: [],
                },
            }
        })
        slowMode.recordSubmission(props.discussion.id)
        replyTo.value = false
        replyText.value = ""
        emit("refresh")
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
    <main v-if="comment" class="comment" :id="comment.id">
        <header class="row g-1">
            <Votes :target="comment" />
            <UserTag :user="comment.user" />
            <Tag v-if="comment.edited" type="info">
                <i class="fa-solid fa-stopwatch"></i>
                {{ formatDate(comment.time) }}
                <i class="fa-solid fa-eraser"></i>
                {{ formatDate(comment.timeEdited) }}
            </Tag>
            <DurationTag v-else :time="comment.time" />
            <button v-if="!comment.deleted && comment.status === 'active'" type="button" class="link small reply-action" :disabled="replyState.disabled" @click="replyToComment">
                <i class="fa-solid fa-reply"></i>
                <span>Reply</span>
            </button>
            <Tag v-if="comment.status === 'quarantined'" type="danger" label="Removed" />
            <ClientOnly>
                <template v-if="session.isAuthenticated && !comment.deleted && comment.status === 'active'">
                    <Tag class="link" icon="fa-ellipsis" title="Options" @click="emit('options', comment)" />
                </template>
            </ClientOnly>
            <ModerationState :moderation="comment.moderation" content-type="comment" />
        </header>
        <template v-if="!editing && comment.status !== 'quarantined'">
            <Markdown class="p-3" :content="comment.content" />
        </template>
        <p v-else-if="comment.status === 'quarantined'" class="p-3">[This comment was removed by moderators.]</p>
        <CollapseTransition>
            <ReplyComposer
                v-if="replyTo"
                class="comment-reply px-3 pb-3"
                autofocus
                :submitting="submitting"
                :disabled="replyState.disabled"
                :warning="replyState.warning"
                @submit="submitComment(comment, replyText)"
                @cancel="cancelComment"
                v-model="replyText"
            />
        </CollapseTransition>
        <div class="comment-edit column g-2 px-3 pb-3 mt-2" v-if="editing">
            <MarkdownEditor :rows="5" v-model="comment.content" />
            <div class="row g-1">
                <Tag type="success" icon="fa-save" label="Save" @click="updateComment(comment)" />
                <Tag type="danger" icon="fa-cancel" label="Cancel" @click="emit('finish-edit')" />
            </div>
        </div>
    </main>
</template>

<style lang="scss">
main.comment {
    .reply-action {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
    }

    header.row {
        @media (max-width: $bp-tablet) {
            flex-wrap: wrap;
        }
    }
    
    .comment-reply, .comment-edit {
        textarea {
            max-height: 256px;
        }
    }
}
</style>