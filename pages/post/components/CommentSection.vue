<script setup lang="ts">
import type { Post, Comment, User } from '~/types'

const route = useRoute()
const postId = route.params.postId.toString()
const { post, comments } = usePost(postId)

const vote = useVoting()
const session = getSession()

let sortType = ref("hot")
function sort(type: string) {
    sortType.value = type
    sortBy(comments.items!, type)
}

let commentReply = ref("")
let commentToReplyTo = ref("")
let commentToEdit = ref("")

function replyToComment(comment: Comment) {
    commentToReplyTo.value = (commentToReplyTo.value !== comment.id) ? comment.id : "";
}

function editComment(comment: Comment) {
    commentToEdit.value = (commentToEdit.value !== comment.id) ? comment.id : "";
}

async function updateComment(comment: Comment) {
    await session.useApi(`/api/comment/${extractId(comment.id)}/edit`, { content: comment.content })
    commentToEdit.value = "";
}

async function submitComment(replyTo: Post | Comment, content: string) {
    await session.useApi<Comment>("/api/comment/add", {
        time: new Date(),
        user: session.user?.id,
        post: post.value?.id,
        replyTo: replyTo.id,
        content: content,
        votes: {
            positive: [session.user!.id],
            misleading: [],
            negative: [],
        },
    })

    post.fetch()
    comments.fetch()

    commentReply.value = ""
    commentToReplyTo.value = ""
}

</script>

<template>
    <section class="comments p-5" v-if="comments.items && comments.items.length > 0">
        <header class="sorting row g-1 mb-3">
            <button class="fill" @click="sort('new')" :class="{ selected: sortType === 'new' }">
                <i class="fa-solid fa-egg"></i>
                <span>New</span>
            </button>
            <button class="fill" @click="sort('hot')" :class="{ selected: sortType === 'hot' }">
                <i class="fa-solid fa-fire"></i>
                <span>Hot</span>
            </button>
            <button class="fill" @click="sort('top')" :class="{ selected: sortType === 'top' }">
                <i class="fa-solid fa-ranking-star"></i>
                <span>Top</span>
            </button>
        </header>
        <Tree :items="comments.items ?? []" :children="comments.items?.filter(c => c.replyTo === post.value?.id) ?? []" :get-children="(comment: Comment, comments: Comment[]) => comments.filter(c => c.replyTo === comment.id)">
            <template #item="{ item: comment }">
                <div class="comment" :id="comment.id">
                    <header class="row-fit g-1">
                        <Votes :target="comment" />
                        <!-- TODO create AuthorTag -->
                        <span class="tag info" @click="navigateTo(`/user/${extractId(comment.user.id)}`)">
                            <i class="fa-solid fa-feather-pointed" v-if="comment.user.id === (post.value?.user as User).id"></i>    
                            <i class="fa-solid fa-user" v-else></i>
                            {{ `${comment.user?.name}` }}
                        </span>
                        <TimeTag :time="comment.time" />
                        <Tag :hidden="!comment.timeEdited" type="danger" icon="fa-eraser" :label="formatDate(comment.timeEdited)" />
                        <ClientOnly>
                            <Tag :hidden="!session.isAuthenticated" type="link" icon="fa-reply" label="Reply" @click="replyToComment(comment)" />
                            <Tag :hidden="comment.user.id !== session.user.id" type="link" icon="fa-eraser" label="Edit" @click="editComment(comment)" />
                        </ClientOnly>
                    </header>
                    <Markdown class="body p-3" v-if="commentToEdit !== comment.id" :content="comment.content" />
                    <div class="comment-reply field px-3 pb-3" v-if="commentToReplyTo === comment.id">
                        <textarea class="textarea" rows="2" v-model="commentReply"></textarea>
                        <div class="row-fit g-1 pt-2">
                            <Tag type="success" icon="fa-message" label="Submit" @click="submitComment(comment, commentReply)" />
                            <Tag type="danger" icon="fa-cancel" label="Cancel" @click="replyToComment(comment)" />
                        </div>
                    </div>
                    <div class="comment-edit field px-3 pb-3 mt-2" v-if="commentToEdit === comment.id">
                        <textarea class="textarea" rows="5" v-model="comment.content"></textarea>
                        <div class="row-fit g-1 pt-2">
                            <Tag type="success" icon="fa-save" label="Save" @click="updateComment(comment)" />
                            <Tag type="danger" icon="fa-cancel" label="Cancel" @click="editComment(comment)" />
                        </div>
                    </div>
                </div>
            </template>
        </Tree>
    </section>
</template>

<style scoped lang="scss">
section.comments {
    border-radius: 0.5rem;
    background-color: $dox-white-0;
    
    @media screen and (max-width: 600px) {
        padding: 1rem !important;
    }
}

header.sorting {
    button.selected {
        color: $dox-white-0;
        background-color: $dox-white-3;
    }
}

div.comment {
    flex: 1 1;
    @include flex-v;

    header.row-fit {
        @media screen and (max-width: 600px) {
            flex-wrap: wrap;

            span.tag {
                padding-inline: 0.75rem;
            }
        }
    }
    
    .comment-reply, .comment-edit {
        textarea {
            max-height: 256px;
        }
    }
}
</style>