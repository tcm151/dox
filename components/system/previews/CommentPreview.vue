<script setup lang="ts">
import type { Comment, Post, User } from '~/types';

const hints = useHints()
const session = getSession()

const props = defineProps<{
    post: Post
    comment: Comment
}>()

const emit = defineEmits<{
    (event: 'refresh'): void
}>()

let replyText = ref("")
let editComment = ref(false)
let replyTo = ref(false)

async function updateComment(comment: Comment) {
    await session.useApi(`/api/comment/${extractId(comment.id)}/edit`, { content: comment.content })
    emit("refresh")
}

async function submitComment(replyId: Post | Comment, content: string) {
    try {
        replyTo.value = false
        await session.useApi<Comment>("/api/comment/add", {
            time: new Date(),
            user: session.user?.id,
            post: props.post.id,
            replyTo: replyId.id,
            content: content,
            votes: {
                positive: [session.user!.id],
                misleading: [],
                negative: [],
            },
        })
        replyText.value = ""
        emit("refresh")
    }
    catch (error: any) {
        hints.addError(error.message)
    }
}
</script>


<template>
    <main v-if="comment" class="comment" :id="comment.id">
        <header class="row-fit g-1">
            <Votes :target="comment" />
            <!-- TODO create AuthorTag -->
            <span class="tag info" @click="navigateTo(`/user/${extractId(comment.user as string)}`)">
                <!-- <i class="fa-solid fa-feather-pointed" v-if="comment.user === (post.user as User).id"></i>     -->
                <i class="fa-solid fa-user"></i>
                {{ `${(comment.user as User).name}` }}
            </span>
            <Tag type="info" icon="fa-stopwatch" :label="formatDate(comment.time)" />
            <Tag :hidden="!comment.timeEdited" type="danger" icon="fa-eraser" :label="formatDate(comment.timeEdited)" />
            <ClientOnly>
                <Tag :hidden="!session.isAuthenticated" type="link" icon="fa-reply" label="Reply" @click="replyTo = true" />
                <Tag :hidden="(comment.user as User).id !== session.user.id" type="link" icon="fa-eraser" label="Edit" @click="editComment = true" />
            </ClientOnly>
        </header>
        <Markdown class="body p-3" v-if="!editComment" :content="comment.content" />
        <div class="comment-reply field px-3 pb-3" v-if="replyTo">
            <textarea class="textarea" rows="2" v-model="replyText"></textarea>
            <div class="row-fit g-1 pt-2">
                <Tag type="success" icon="fa-message" label="Submit" @click="submitComment(comment, replyText)" />
                <Tag type="danger" icon="fa-cancel" label="Cancel" @click="replyTo = false" />
            </div>
        </div>
        <div class="comment-edit field px-3 pb-3 mt-2" v-if="editComment">
            <textarea class="textarea" rows="5" v-model="comment.content"></textarea>
            <div class="row-fit g-1 pt-2">
                <Tag type="success" icon="fa-save" label="Save" @click="updateComment(comment)" />
                <Tag type="danger" icon="fa-cancel" label="Cancel" @click="editComment = false" />
            </div>
        </div>
    </main>
</template>

<style lang="scss">
main.comment {
    header.row-fit {
        @media screen and (max-width: 600px) {
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