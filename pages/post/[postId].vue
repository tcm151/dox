<script setup lang="ts">
import { cp } from 'fs';
import { Post, Comment } from '~/types/types';

const route = useRoute();
const vote = useVoting();
const session = getSession();

const { data: post } = useFetch<Post>(`/api/post/${route.params.postId}`)
const { data: comments } = useFetch<Comment[]>(`/api/post/${route.params.postId}/comments`)

let showPostReply = ref(false);
function toggleCommentBox() {
    showPostReply.value = !showPostReply.value;
}

let postReply = ref("");
function submitPostReply() {
    const { data: comment } = useFetch<Comment>("/api/comment/new", {
        method: "POST",
        body: {
            time: new Date(),
            user: session.user?.id,
            post: post.value?.id,
            replyTo: post.value?.id,
            content: postReply.value,
            votes: {
                upvotes: [session.user!.id],
                misleading: [],
                downvotes: [],
            },
        }
    })

    postReply.value = "";
    toggleCommentBox();
}

let commentReply = ref("")
let showCommentReply = ref(false)
let commentToReplyTo = ref("")
function toggleReply(comment: Comment) {
    commentToReplyTo.value = (commentToReplyTo.value !== comment.id) ? comment.id : "";
}

function submitCommentReply(replyTo: Comment) {
    const { data: comment } = useFetch<Comment>("/api/comment/new", {
        method: "POST",
        body: {
            time: new Date(),
            user: session.user?.id,
            post: post.value?.id,
            replyTo: replyTo.id,
            content: commentReply.value,
            votes: {
                upvotes: [session.user!.id],
                misleading: [],
                downvotes: [],
            },
        }
    })

    commentReply.value = "";
    commentToReplyTo.value = ""
}
</script>

<template>
    <div class="post m-5 p-5">
        <h2 class="mb-2">{{ post?.title }}</h2>
        <div class="row">
            <div class="row votes">
                <span class="upvote" @click="vote.upvote(post!.votes)">{{ post?.votes.upvotes.length }}</span>
                <span class="misleading" @click="vote.misleading(post!.votes)">{{ post?.votes.misleading.length }}</span>
                <span class="downvote" @click="vote.downvote(post!.votes)">{{ post?.votes.downvotes.length }}</span>
            </div>
            <span class="topic" v-for="topic in post?.topics">
                {{ topic }}
            </span>
            <span class="info">u/{{ post?.user.name ?? "deleted" }}</span>
            <span class="info">{{ post?.time }}</span>
        </div>
        <div class="content my-5">
            {{ post?.content }}
        </div>
        <ClientOnly>
            <div class="column g-2" v-if="session.isAuthenticated">
                <div class="row" v-if="!showPostReply">
                    <button @click="toggleCommentBox">Comment</button>
                    <button>Reply</button>
                    <button>Share</button>
                    <button v-if="post?.user.id == session.user?.id">
                        Edit
                    </button>
                    <button class="link" style="flex: 0 1">
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
            <div class="row mt-1" v-else>
                <button class="danger">You must be logged in to interact with other people.</button>
            </div>
        </ClientOnly>
    </div>
    <div class="comments m-5 p-5">
        <Tree :items="comments ?? []" :children="comments?.filter(c => c.replyTo === post?.id) ?? []" :get-children="(comment: Comment, comments: Comment[]) => comments.filter(c => c.replyTo === comment.id)">
            <template #item="{ item: comment}">
                <div class="comment">
                    <!-- <div class="comment-line"></div> -->
                    <div class="real">
                        <div class="header row">
                            <div class="row votes">
                                <span class="upvote" @click="vote.upvote(comment.votes)">
                                    {{comment.votes.upvotes.length}}
                                </span>
                                <span class="misleading" @click="vote.misleading(comment.votes)">
                                    {{comment.votes.misleading.length}}
                                </span>
                                <span class="downvote" @click="vote.downvote(comment.votes)">
                                    {{comment.votes.downvotes.length}}
                                </span>
                            </div>
                            <span class="link">{{ `u/${comment.user?.name}` }}</span>
                            <span class="link">{{ comment.time }}</span>
                            <span class="reply" @click="toggleReply(comment)">Reply</span>
                        </div>
                        <div class="body p-3">
                            <p>{{ comment.content }}</p>
                        </div>
                        <div class="comment-reply field px-3 pb-3" v-if="commentToReplyTo === comment.id">
                            <textarea class="textarea" rows="2" v-model="commentReply"></textarea>
                            <div class="row g-2 pt-2">
                                <span class="success" @click="submitCommentReply(comment)">Submit</span>
                                <span class="danger" @click="toggleReply(comment)">Cancel</span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <!-- TODO: this does not work... -->
            <template #child="{ item: comment }">
                <div class="comment">
                    <!-- <div class="comment-line"></div> -->
                    <div class="real">
                        <div class="header row">
                            <div class="row votes">
                                <span class="upvote" @click="vote.upvote(comment.votes)">
                                    {{comment.votes.upvotes.length}}
                                </span>
                                <span class="misleading" @click="vote.misleading(comment.votes)">
                                    {{comment.votes.misleading.length}}
                                </span>
                                <span class="downvote" @click="vote.downvote(comment.votes)">
                                    {{comment.votes.downvotes.length}}
                                </span>
                            </div>
                            <span class="link">{{ `u/${comment.user?.name}` }}</span>
                            <span class="link">{{ comment.time }}</span>
                            <span class="reply" @click="toggleReply(comment)">Reply</span>
                        </div>
                        <div class="body p-3">
                            <p>{{ comment.content }}</p>
                        </div>
                        <div class="comment-reply field px-3 pb-3" v-if="commentToReplyTo === comment.id">
                            <textarea class="textarea" rows="2" v-model="commentReply"></textarea>
                            <div class="row g-2 pt-2">
                                <span class="success" @click="submitCommentReply(comment)">Submit</span>
                                <span class="danger" @click="toggleReply(comment)">Cancel</span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </Tree>
    </div>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";

.post, .comments {
    width: 750px;
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
}

.row {
    gap: 0.25rem;
    white-space: nowrap;
}

.votes {
    flex: 0 1;

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
    @include flex-h;

    .comment-line {
        width: 0.25em;
        margin-right: 0.25rem;
        border-radius: 0.25em;
        background-color: $dox-white;
    }

    .real {
        @include flex-v;
    }
}

.reply {
    background-color: $dox-white;
}

.comment-reply {
    textarea {
        max-height: 256px;
    }
}
</style>
