<script setup lang="ts">
import type { Comment, Post } from '~/types';

const hints = useHints()
const session = getSession()

const props = defineProps<{
    comment: Comment
}>()

const emit = defineEmits<{
    (event: 'refresh'): void
}>()

let replyText = ref("")
let editComment = ref(false)
let replyTo = ref(false)

let commentBox = useTemplateRef("comment-box")

async function replyToComment() {
    replyTo.value = true
    await nextTick()
    commentBox.value?.focus()
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
        editComment.value = false
        emit("refresh")
    }
    catch (error: any) {
        hints.addError(error.message)
    }
}

async function submitComment(replyId: Post | Comment, content: string) {
    if (!session.isAuthenticated) {
        hints.addError("You must be logged in to interact with others.")
        return
    }
    try {
        await useApi<Comment>("/api/comment/add", {
            body: {
                time: new Date(),
                user: session.user.id,
                post: props.comment.post,
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
        hints.addError(error.message)
    }
}

async function deleteComment(commentId: string) {
    try {
        await useApi(`/api/comment/${extractId(commentId)}/delete`)
        emit("refresh")
    }
    catch (error: any) {
        hints.addError(error.message)
    }
}
</script>


<template>
    <main v-if="comment" class="comment" :id="comment.id">
        <header class="row g-1">
            <Votes :target="comment" />
            <!-- TODO create AuthorTag -->
            <span class="tag info" @click="navigateTo(`/user/${extractId(comment.user.id)}`)">
                <i class="fa-solid fa-user"></i>
                {{ `${comment.user.name}` }}
            </span>
            <Tag v-if="comment.edited" type="info">
                <i class="fa-solid fa-stopwatch"></i>
                {{ formatDate(comment.time) }}
                <i class="fa-solid fa-eraser"></i>
                {{ formatDate(comment.timeEdited) }}
            </Tag>
            <DurationTag v-else :time="comment.time" />
            <Tag v-if="!comment.deleted" type="link" icon="fa-reply" label="Reply" @click="replyToComment" />
            <ClientOnly>
                <template v-if="!comment.deleted && comment.user.id === session.user.id">
                    <Tag type="link" icon="fa-eraser" title="Edit" @click="editComment = true" />
                    <Tag type="link" icon="fa-trash-can" title="Delete" @click="deleteComment(comment.id)" />
                </template>
            </ClientOnly>
        </header>
        <Markdown v-if="!editComment" class="body p-3" :content="comment.content" />
        <div v-if="replyTo" class="comment-reply field px-3 pb-3">
            <textarea ref="comment-box" rows="2" v-model="replyText"></textarea>
            <div class="row g-1 pt-2">
                <Tag type="success" icon="fa-comment" label="Submit" @click="submitComment(comment, replyText)" />
                <Tag type="danger" icon="fa-cancel" label="Cancel" @click="cancelComment" />
            </div>
        </div>
        <div class="comment-edit field px-3 pb-3 mt-2" v-if="editComment">
            <textarea rows="5" v-model="comment.content"></textarea>
            <div class="row g-1 pt-2">
                <Tag type="success" icon="fa-save" label="Save" @click="updateComment(comment)" />
                <Tag type="danger" icon="fa-cancel" label="Cancel" @click="editComment = false" />
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