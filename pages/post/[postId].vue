<script setup lang="ts">
import { Post, Comment } from '~/types'

const route = useRoute();
const postId = route.params.postId.toString();
const { post, comments } = usePost(postId)

onMounted(() => sortBy(comments.items!, "hot"))

const vote = useVoting();
const hints = useHints();
const session = getSession();

let editingPost = ref(false)
function toggleEditPost() {
    editingPost.value = !editingPost.value;
}

function updatePost(changes: Post | null ) {
    if (!changes) {
        hints.addError("You can't edit something that doesn't exist.")
        return
    }

    const response = session.useApi(`/api/post/${postId}/edit`, post.value?.content);
    post.value!.edited = true;
    console.log(response);
    toggleEditPost();
}

function previewChanges() {

}

let showPostReply = ref(false);
function toggleCommentBox() {
    showPostReply.value = !showPostReply.value;
}

let postReply = ref("");
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

    showPostReply.value = false
    postReply.value = ""
    commentReply.value = ""
    commentToReplyTo.value = ""
}

function copyLink() {
    const postLink = window.location.href
    navigator.clipboard.writeText(postLink);
    hints.addSuccess("Copied post URL");
}

let sortType = ref("hot")
function sort(type: string) {
    sortType.value = type
    sortBy(comments.items!, type)
}

let commentReply = ref("")
let commentToReplyTo = ref("")
let commentToEdit = ref("");

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
</script>

<template>
    <article id="post" class="column g-2 p-4">
        <section class="post p-5">
            <h2 class="mb-2">{{ post.value?.title }}</h2>
            <div class="tags row-wrap g-1">
                <div class="row votes">
                    <span class="positive" @click="vote.positive(post.value)">
                        {{ post.value?.votes.positive.length }}
                    </span>
                    <span class="misleading" @click="vote.misleading(post.value)">
                        {{ post.value?.votes.misleading.length }}
                    </span>
                    <span class="negative" @click="vote.negative(post.value)">
                        {{ post.value?.votes.negative.length }}
                    </span>
                </div>
                <span class="topic" v-for="topic in post.value?.topics" @click="navigateTo(`/topic/${topic}`)">
                    {{ topic }}
                </span>
                <span class="info" @click="navigateTo(`/user/${extractId(post.value?.user.id)}`)">u/{{ post.value?.user.name ?? "deleted" }}</span>
                <ClientOnly>
                    <span class="info">{{ formatDate(post.value?.time as any) }}</span>
                    <span class="danger" v-if="post.value?.edited">Edited {{ formatDate(post.value?.timeEdited!) }}</span>
                </ClientOnly>
            </div>
            <div class="content my-4" v-html="renderMarkdown(post.value?.content)"></div>
            <div class="field mb-5" v-if="post && editingPost && post.value?.user.id === session.user?.id">
                <textarea rows="10" v-model="post.value.content"></textarea>
            </div>
            <ClientOnly>
                <div class="column g-2" v-if="session.isAuthenticated">
                    <section class="interactions row" v-if="!showPostReply && !editingPost">
                        <button @click="toggleCommentBox">
                            <i class="fa-solid fa-message"></i>
                            <span>Comment</span>
                        </button>
                        <!-- TODO allow replying to posts -->
                        <button>
                            <i class="fa-solid fa-reply-all"></i>
                            <span>Reply</span>
                        </button>
                        <button @click="copyLink">
                            <i class="fa-solid fa-envelope"></i>
                            <span>Share</span>
                        </button>
                        <button @click="copyLink">
                            <i class="fa-solid fa-box-archive"></i>
                            <span>Archive</span>
                        </button>
                        <button v-if="post.value?.user.id === session.user?.id" @click="toggleEditPost()">
                            <i class="fa-solid fa-screwdriver-wrench"></i>
                            <span>Edit</span>
                        </button>
                        <button style="flex: 0 1">
                            <i class="fa-solid fa-ellipsis"></i>
                        </button>
                    </section>
                    <div class="row" v-if="editingPost">
                        <button @click="previewChanges()">Preview</button>
                        <button @click="updatePost(post.value)">Save</button>
                        <button @click="toggleEditPost()">Cancel</button>
                        <button style="flex: 0 1">
                            <i class="fa-solid fa-ellipsis"></i>
                        </button>
                    </div>
                    <div class="field" v-if="showPostReply">
                        <textarea rows="5" v-model="postReply"></textarea>
                        <div class="row mt-2">
                            <button class="success" @click="submitComment(post.value!, postReply)">Submit</button>
                            <button class="danger" @click="toggleCommentBox">Cancel</button>
                        </div>
                    </div>
                </div>
                <div class="row" v-else>
                    <button class="danger">You must be logged in to interact with others.</button>
                </div>
            </ClientOnly>
        </section>
        <section class="comments p-5" v-if="(comments.items?.length ?? 0) > 0">
            <div class="sorting row g-2 mb-3">
                <button @click="sort('new')" :class="{ selected: sortType === 'new' }">
                    <i class="fa-solid fa-egg"></i>
                    <span>New</span>
                </button>
                <button @click="sort('hot')" :class="{ selected: sortType === 'hot' }">
                    <i class="fa-solid fa-fire"></i>
                    <span>Hot</span>
                </button>
                <button @click="sort('top')" :class="{ selected: sortType === 'top' }">
                    <i class="fa-solid fa-ranking-star"></i>
                    <span>Top</span>
                </button>
            </div>
            <Tree :items="comments.items ?? []" :children="comments.items?.filter(c => c.replyTo === post.value?.id) ?? []" :get-children="(comment: Comment, comments: Comment[]) => comments.filter(c => c.replyTo === comment.id)">
                <template #item="{ item: comment}">
                    <div class="comment">
                        <header class="row-fit g-1">
                            <div class="votes row">
                                <span class="positive" @click="vote.positive(comment)">
                                    {{comment.votes.positive.length}}
                                </span>
                                <span class="misleading" @click="vote.misleading(comment)">
                                    {{comment.votes.misleading.length}}
                                </span>
                                <span class="negative" @click="vote.negative(comment)">
                                    {{comment.votes.negative.length}}
                                </span>
                            </div>
                            <span class="info" @click="navigateTo(`/user/${extractId(comment.user.id)}`)">
                                {{ `u/${comment.user?.name}` }}
                                <i class="fa-solid fa-feather-pointed" v-if="comment.user.id === post.value?.user.id"></i>    
                            </span>
                            <ClientOnly>
                                <span class="info">{{ formatDate(comment.time as any) }}</span>
                                <span class="danger" v-if="comment.edited">Edited {{ formatDate(comment.timeEdited) }}</span>
                                <span class="reply" v-if="session.isAuthenticated" @click="replyToComment(comment)">Reply</span>
                                <span class="edit" v-if="comment.user.id === session.user?.id" @click="editComment(comment)">Edit</span>
                            </ClientOnly>
                        </header>
                        <div class="body p-3" v-if="commentToEdit !== comment.id" v-html="renderMarkdown(comment.content)"></div>
                        <div class="comment-reply field px-3 pb-3" v-if="commentToReplyTo === comment.id">
                            <textarea class="textarea" rows="2" v-model="commentReply"></textarea>
                            <div class="row-fit g-1 pt-2">
                                <span class="success" @click="submitComment(comment, commentReply)">Submit</span>
                                <span class="danger" @click="replyToComment(comment)">Cancel</span>
                            </div>
                        </div>
                        <div class="comment-reply field px-3 pb-3 mt-2" v-if="commentToEdit === comment.id">
                            <textarea class="textarea" rows="5" v-model="comment.content"></textarea>
                            <div class="row-fit g-1 pt-2">
                                <span class="success" @click="updateComment(comment)">Save</span>
                                <span class="danger" @click="editComment(comment)">Cancel</span>
                            </div>
                        </div>
                    </div>
                </template>
            </Tree>
        </section>
    </article>
</template>

<style lang="scss">
img {
    max-width: 100%;
    max-height: 256px;
}
</style>


<style scoped lang="scss">
article#post {
    @include fit-width(800px, 1rem);
}

.post, .comments {
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
}

.topic, .info {
    cursor: pointer;
}

.row {
    gap: 0.25rem;
    white-space: nowrap;
}

section.interactions {
    button {
        @include flex-h;
        align-items: center;
        gap: 0.5rem;
    }
}

.votes {
    flex: 0 1;
    cursor: pointer;

    span {
        width: 1rem;
    }
}

div.tags, .comment > header {
    span {
        padding: 0.25rem 0.5rem;
    
        font-size: 0.8rem;
        font-weight: 700;
        text-align: center;
    
        outline: 1px transparent;
        border-radius: 0.25rem;
    }
    
    span:hover {
        background-color: #AAA;
    }
}

div.sorting {
    button {
        flex: 1 1;
        @include flex-h (0.5rem);
        align-items: center;
        justify-content: center;
    }

    .selected {
        color: $dox-white-ultra;
        background-color: $dox-grey-light;
    }
}

.comment {
    flex: 1 1;
    @include flex-v;

    .body {
        p {
            img {
                max-height: 256px;
            }
        }
    }

    .reply, .edit {
        background-color: $dox-white;
    }

    .reply:hover, .edit:hover {
        color: $dox-white-ultra;
        background-color: $dox-grey-light;
    }
    
    .comment-reply {
        textarea {
            max-height: 256px;
        }
    }
}

</style>
