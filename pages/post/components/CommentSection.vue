<script setup lang="ts">
import { Post, Comment, User } from '~/types'

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
    await session.useApi(`/api/comment/${extractId(comment.id)}/edit`, comment.content)
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
        <header class="sorting row g-2 mb-3">
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
                        <div class="votes row g-1">
                            <span class="tag positive" @click="vote.positive(comment)" :class="{ voted: comment.votes.positive.includes(session.user.id)}">
                                {{comment.votes.positive.length}}
                            </span>
                            <span class="tag misleading" @click="vote.misleading(comment)" :class="{ voted: comment.votes.misleading.includes(session.user.id)}">
                                {{comment.votes.misleading.length}}
                            </span>
                            <span class="tag negative" @click="vote.negative(comment)" :class="{ voted: comment.votes.negative.includes(session.user.id)}">
                                {{comment.votes.negative.length}}
                            </span>
                        </div>
                        <span class="tag info" @click="navigateTo(`/user/${extractId(comment.user.id)}`)">
                            <i class="fa-solid fa-feather-pointed" v-if="comment.user.id === (post.value?.user as User).id"></i>    
                            <i class="fa-solid fa-user" v-else></i>
                            {{ `${comment.user?.name}` }}
                        </span>
                        <span class="tag info">
                            <i class="fa-solid fa-calendar"></i>
                            <span>{{ formatDate(comment.time as any) }}</span>
                        </span>
                        <span class="tag danger" v-if="comment.edited">
                            <i class="fa-solid fa-eraser"></i>
                            <span>{{ formatDate(comment.timeEdited) }}</span>    
                        </span>
                        <div class="row g-1">
                            <ClientOnly>
                                <span class="tag link reply" v-if="session.isAuthenticated" @click="replyToComment(comment)">
                                    <i class="fa-solid fa-reply"></i>
                                    <span>Reply</span>
                                </span>
                                <span class="tag link edit" v-if="comment.user.id === session.user?.id" @click="editComment(comment)">
                                    <i class="fa-solid fa-eraser"></i>
                                    <span>Edit</span>
                                </span>
                            </ClientOnly>
                        </div>
                    </header>
                    <Markdown class="body p-3" v-if="commentToEdit !== comment.id" :content="comment.content" />
                    <div class="comment-reply field px-3 pb-3" v-if="commentToReplyTo === comment.id">
                        <textarea class="textarea" rows="2" v-model="commentReply"></textarea>
                        <div class="row-fit g-1 pt-2">
                            <span class="tag success" @click="submitComment(comment, commentReply)">Submit</span>
                            <span class="tag danger" @click="replyToComment(comment)">Cancel</span>
                        </div>
                    </div>
                    <div class="comment-edit field px-3 pb-3 mt-2" v-if="commentToEdit === comment.id">
                        <textarea class="textarea" rows="5" v-model="comment.content"></textarea>
                        <div class="row-fit g-1 pt-2">
                            <span class="tag success" @click="updateComment(comment)">Save</span>
                            <span class="tag danger" @click="editComment(comment)">Cancel</span>
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

    header {
        @media screen and (max-width: 600px) {
            flex-wrap: wrap;

            span.tag {
                padding-inline: 0.75rem;
            }

            span.tag.reply, span.tag.edit {
                span {
                    display: none;
                }
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