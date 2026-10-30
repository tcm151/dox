<script setup lang="ts">
import type { Comment, Post, Gallery } from '@@/shared/types';

const hints = useHints()
const session = getSession()

const props = defineProps<{
    comment: Comment
    editing: boolean
}>()

const emit = defineEmits<{
    (event: 'refresh'): void
    (event: 'options', comment: Comment): void
    (event: 'finish-edit'): void
}>()

let replyText = ref("")
let replyTo = ref(false)

let commentBox = useTemplateRef("comment-box")

async function replyToComment() {
    replyTo.value = true
    await nextTick()
    commentBox.value?.focus({ preventScroll: true })
}

function cancelComment() {
    replyTo.value = false
    replyText.value = ""
}

async function updateComment(comment: Comment) {
    try {
        await useApi(`/api/comment/${extractId(comment.id)}/edit`, {
            body: {
                content: comment.content
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
    if (!session.isAuthenticated) {
        hints.addWarning("You must be logged in to interact with others.")
        return
    }
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
        replyTo.value = false
        replyText.value = ""
        emit("refresh")
    }
    catch (error: any) {
        hints.addError(error.message, error)
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
            <Tag v-if="!comment.deleted && comment.status === 'active'" type="link" icon="fa-reply" label="Reply" @click="replyToComment" />
            <Tag v-if="comment.status === 'quarantined'" type="danger" label="Removed" />
            <ClientOnly>
                <template v-if="session.isAuthenticated && !comment.deleted && comment.status === 'active'">
                    <Tag class="link" icon="fa-ellipsis" title="Options" @click="emit('options', comment)" />
                </template>
            </ClientOnly>
        </header>
        <Markdown v-if="!editing && comment.status !== 'quarantined'" class="p-3" :content="comment.content" />
        <p v-else-if="comment.status === 'quarantined'" class="p-3">[This comment was removed by moderators.]</p>
        <CollapseTransition>
            <div v-if="replyTo" class="comment-reply field px-3 pb-3">
                <textarea ref="comment-box" rows="2" v-model="replyText"></textarea>
                <div class="row g-1 pt-2">
                    <Tag type="success" icon="fa-comment" label="Submit" @click="submitComment(comment, replyText)" />
                    <Tag type="danger" icon="fa-cancel" label="Cancel" @click="cancelComment" />
                </div>
            </div>
        </CollapseTransition>
        <div class="comment-edit field px-3 pb-3 mt-2" v-if="editing">
            <textarea rows="5" v-model="comment.content"></textarea>
            <div class="row g-1 pt-2">
                <Tag type="success" icon="fa-save" label="Save" @click="updateComment(comment)" />
                <Tag type="danger" icon="fa-cancel" label="Cancel" @click="emit('finish-edit')" />
            </div>
        </div>
    </main>
</template>

<style lang="scss">
main.comment {
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