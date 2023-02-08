<script setup lang="ts">
import { Post, Comment } from '~/types/types';

const route = useRoute();
const postId = route.params.postId;

const vote = useVoting();
const hints = useHints();
const sorting = useSorting();
const session = getSession();

const { data: post, pending } = await useFetch<Post>(`/api/post/${postId}`)
const { data: comments, refresh: fetchComments } = await useFetch<Comment[]>(`/api/post/${postId}/comments`)

onMounted(() => sorting.sortBy(comments.value!, "hot"))

// useServerSeoMeta({
//     ogTitle: () => post.value?.title ?? postId[0],
//     creator: () => post.value?.user.id
// })

let showPostReply = ref(false);
function toggleCommentBox() {
    showPostReply.value = !showPostReply.value;
}

let postReply = ref("");
async function submitPostReply() {
    await session.useApi<Comment>("/api/comment/new", {
        time: new Date(),
        user: session.user?.id,
        post: post.value?.id,
        replyTo: post.value?.id,
        content: postReply.value,
        votes: {
            positive: [session.user!.id],
            misleading: [],
            negative: [],
        },
    })

    fetchComments();
    toggleCommentBox();
    postReply.value = "";
}

let commentReply = ref("")
let commentToReplyTo = ref("")

function replyToComment(comment: Comment) {
    commentToReplyTo.value = (commentToReplyTo.value !== comment.id) ? comment.id : "";
}

async function submitCommentReply(replyTo: Comment) {
    await session.useApi<Comment>("/api/comment/new", {
        time: new Date(),
        user: session.user?.id,
        post: post.value?.id,
        replyTo: replyTo.id,
        content: commentReply.value,
        votes: {
            positive: [session.user!.id],
            misleading: [],
            negative: [],
        },
    })

    fetchComments();
    commentReply.value = "";
    commentToReplyTo.value = ""
}

let editingPost = ref(false)

function toggleEditPost() {
    editingPost.value = !editingPost.value;
}

function saveChanges(item: Post | Comment | null ) {
    const response = session.useApi(`/api/post/${postId}/edit`, post.value?.content);
    post.value!.edited = true;
    console.log(response);
    toggleEditPost();
}

function previewChanges() {

}

function copyLink() {
    const postLink = window.location.href
    navigator.clipboard.writeText(postLink);
    hints.addSuccess("Copied post URL");
}

</script>

<template>
    <div id="post" class="column g-5">
        <div class="post p-5">
            <h2 class="mb-2">{{ post?.title }}</h2>
            <div class="row-wrap g-1">
                <div class="row votes">
                    <span class="positive" @click="vote.positive(post!.id, post!.votes)">
                        {{ post?.votes.positive.length }}
                    </span>
                    <span class="misleading" @click="vote.misleading(post!.id, post!.votes)">
                        {{ post?.votes.misleading.length }}
                    </span>
                    <span class="negative" @click="vote.negative(post!.id, post!.votes)">
                        {{ post?.votes.negative.length }}
                    </span>
                </div>
                <span class="topic" v-for="topic in post?.topics" @click="navigateTo(`/topic/${topic}`)">
                    {{ topic }}
                </span>
                <span class="info" @click="navigateTo(`/user/${getId(post?.user.id)}`)">u/{{ post?.user.name ?? "deleted" }}</span>
                <ClientOnly>
                    <span class="info">{{ formatDate(post?.time as any) }}</span>
                    <span class="danger" v-if="post?.edited">Edited {{ formatDate(post?.timeEdited as any) }}</span>
                </ClientOnly>
            </div>
            <div class="content mt-5" v-html="renderMarkdown(post?.content)"></div>
            <div class="field mb-5" v-if="post && editingPost && post?.user.id === session.user?.id">
                <textarea rows="10" v-model="post.content"></textarea>
            </div>
            <ClientOnly>
                <div class="column g-2" v-if="session.isAuthenticated">
                    <div class="row" v-if="!showPostReply && !editingPost">
                        <button @click="toggleCommentBox">Comment</button>
                        <!-- <button>Reply</button> -->
                        <button @click="copyLink">Share</button>
                        <button v-if="post?.user.id === session.user?.id" @click="toggleEditPost()">
                            Edit
                        </button>
                        <button style="flex: 0 1">
                            <i class="fa-solid fa-ellipsis"></i>
                        </button>
                    </div>
                    <div class="row" v-if="editingPost">
                        <button @click="previewChanges()">Preview</button>
                        <button @click="saveChanges(post)">Save</button>
                        <button @click="toggleEditPost()">Cancel</button>
                        <button style="flex: 0 1">
                            <i class="fa-solid fa-ellipsis"></i>
                        </button>
                    </div>
                    <div class="field" v-if="showPostReply">
                        <textarea rows="5" v-model="postReply"></textarea>
                        <div class="row mt-2">
                            <button class="success" @click="submitPostReply">Submit</button>
                            <button class="danger" @click="toggleCommentBox">Cancel</button>
                        </div>
                    </div>
                </div>
                <div class="row" v-else>
                    <button class="danger">You must be logged in to interact with others.</button>
                </div>
            </ClientOnly>
        </div>
        <div class="comments p-5" v-if="(comments?.length ?? 0) > 0">
            <Tree :items="comments ?? []" :children="comments?.filter(c => c.replyTo === post?.id) ?? []" :get-children="(comment: Comment, comments: Comment[]) => comments.filter(c => c.replyTo === comment.id)">
                <template #item="{ item: comment}">
                    <div class="comment">
                        <div class="header row-fit g-1">
                            <div class="votes row">
                                <span class="positive" @click="vote.positive(comment.id, comment.votes)">
                                    {{comment.votes.positive.length}}
                                </span>
                                <span class="misleading" @click="vote.misleading(comment.id, comment.votes)">
                                    {{comment.votes.misleading.length}}
                                </span>
                                <span class="negative" @click="vote.negative(comment.id, comment.votes)">
                                    {{comment.votes.negative.length}}
                                </span>
                            </div>
                            <span class="info" v-if="comment.user.id === post?.user.id">
                                {{ `u/${comment.user?.name}` }}
                                <i class="fa-solid fa-feather-pointed"></i>    
                            </span>
                            <span class="info" v-else>
                                {{ `u/${comment.user?.name}` }}
                            </span>
                            <ClientOnly>
                                <span class="info">{{ formatDate(comment.time as any) }}</span>
                                <span class="reply" v-if="session.isAuthenticated" @click="replyToComment(comment)">Reply</span>
                                <!-- TODO allow users to edit their comments -->
                                <span class="edit" v-if="comment.user.id === session.user?.id">Edit</span>
                                <span class="danger" v-if="comment.edited">Edited</span>
                            </ClientOnly>
                        </div>
                        <div class="body p-3">
                            <p v-html="renderMarkdown(comment.content)"></p>
                        </div>
                        <div class="comment-reply field px-3 pb-3" v-if="commentToReplyTo === comment.id">
                            <textarea class="textarea" rows="2" v-model="commentReply"></textarea>
                            <div class="row-fit g-1 pt-2">
                                <span class="success" @click="submitCommentReply(comment)">Submit</span>
                                <span class="danger" @click="replyToComment(comment)">Cancel</span>
                            </div>
                        </div>
                    </div>
                </template>
            </Tree>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";

#post {
    @include fill-width(800px);
}

.content {
    white-space: pre-wrap;
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

.votes {
    flex: 0 1;
    cursor: pointer;

    span {
        width: 1rem;
    }
}

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

.comment {
    flex: 1 1;
    @include flex-v;

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
