<script setup lang="ts">
import { Post, Comment } from '~/types'

const route = useRoute();
const postId = route.params.postId.toString();
const { post, comments } = usePost(postId)

useSeoMeta({
    title: post.value?.title,
    ogTitle: post.value?.title,
    author: post.value?.user.name,
    description: post.value?.content.slice(0, 256),
    ogDescription: post.value?.content.slice(0, 256),
})

useServerSeoMeta({
    robots: {
        index: true,
        noarchive: true
    },
    ogType: 'article',
    ogSiteName: 'DOX For Everything',
})

onMounted(async () => {
    sortBy(comments.items!, "hot")
    await $fetch(`/api/post/${postId}/visit`)
})

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

async function reportPost(post: Post) {
    await session.useApi(`/api/post/${postId}/report`)
    hints.addError("This post has been reported to the development team.")
    // hints.addError("This doesn't currently do anything.")
}
</script>

<template>
    <article id="post" class="column g-2 p-4">
        <section class="post p-5">
            <h2 class="mb-2">{{ post.value?.title }}</h2>
            <div class="tags row-wrap g-1">
                <div class="fit row g-1">
                    <span class="tag positive" @click="vote.positive(post.value)">
                        {{ post.value?.votes.positive.length }}
                    </span>
                    <span class="tag misleading" @click="vote.misleading(post.value)">
                        {{ post.value?.votes.misleading.length }}
                    </span>
                    <span class="tag negative" @click="vote.negative(post.value)">
                        {{ post.value?.votes.negative.length }}
                    </span>
                </div>
                <span class="tag topic" v-for="topic in post.value?.topics" @click="navigateTo(`/topic/${topic.split(':')[1]}`)">
                    {{ topic.split(':')[1] }}
                </span>
                <span class="tag info" @click="navigateTo(`/user/${extractId(post.value?.user.id)}`)">u/{{ post.value?.user.name ?? "deleted" }}</span>
                <ClientOnly>
                    <span class="tag info">{{ formatDate(post.value?.time as any) }}</span>
                    <span class="tag danger" v-if="post.value?.edited">Edited {{ formatDate(post.value?.timeEdited!) }}</span>
                </ClientOnly>
            </div>
            <Markdown class="content my-4" :content="post.value?.content" />
            <div class="field mb-5" v-if="post && editingPost && post.value?.user.id === session.user?.id">
                <textarea rows="10" v-model="post.value.content"></textarea>
            </div>
            <ClientOnly>
                <div class="column g-2" v-if="session.isAuthenticated">
                    <section class="interactions row-wrap g-1" v-if="!showPostReply && !editingPost">
                        <button @click="toggleCommentBox">
                            <i class="fa-solid fa-message"></i>
                            <span>Comment</span>
                        </button>
                        <!-- TODO allow replying to posts -->
                        <!-- <button>
                            <i class="fa-solid fa-reply-all"></i>
                            <span>Reply</span>
                        </button> -->
                        <button @click="copyLink">
                            <i class="fa-solid fa-envelope"></i>
                            <span>Share</span>
                        </button>
                        <!-- TODO allow saving posts, use Directory -->
                        <!-- <button @click="copyLink">
                            <i class="fa-solid fa-box-archive"></i>
                            <span>Archive</span>
                        </button> -->
                        <!-- TODO allow reporting of posts -->
                        <button @click="reportPost(post.value!)">
                            <i class="fa-solid fa-flag"></i>
                            <span>Report</span>
                        </button>
                        <button v-if="post.value?.user.id === session.user?.id" @click="toggleEditPost()">
                            <i class="fa-solid fa-screwdriver-wrench"></i>
                            <span>Edit</span>
                        </button>
                        <button v-if="post.value?.user.id === session.user?.id" @click="">
                            <i class="fa-solid fa-trash-can"></i>
                            <span>Delete</span>
                        </button>
                    </section>
                    <div class="row g-1" v-if="editingPost">
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
                <div class="row not-logged-in" v-else>
                    <button class="danger fill">You must be logged in to interact with others.</button>
                </div>
            </ClientOnly>
        </section>
        <section class="comments p-5" v-if="(comments.items?.length ?? 0) > 0">
            <div class="sorting row g-2 mb-3">
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
            </div>
            <Tree :items="comments.items ?? []" :children="comments.items?.filter(c => c.replyTo === post.value?.id) ?? []" :get-children="(comment: Comment, comments: Comment[]) => comments.filter(c => c.replyTo === comment.id)">
                <template #item="{ item: comment }">
                    <div :id="comment.id" class="comment">
                        <header class="row-fit g-1">
                            <div class="votes row g-1">
                                <span class="tag positive" @click="vote.positive(comment)">
                                    {{comment.votes.positive.length}}
                                </span>
                                <span class="tag misleading" @click="vote.misleading(comment)">
                                    {{comment.votes.misleading.length}}
                                </span>
                                <span class="tag negative" @click="vote.negative(comment)">
                                    {{comment.votes.negative.length}}
                                </span>
                            </div>
                            <span class="tag info" @click="navigateTo(`/user/${extractId(comment.user.id)}`)">
                                {{ `u/${comment.user?.name}` }}
                                <i class="fa-solid fa-feather-pointed" v-if="comment.user.id === post.value?.user.id"></i>    
                            </span>
                            <ClientOnly>
                                <span class="tag info">{{ formatDate(comment.time as any) }}</span>
                                <span class="tag danger" v-if="comment.edited">Edited {{ formatDate(comment.timeEdited) }}</span>
                                <span class="tag reply" v-if="session.isAuthenticated" @click="replyToComment(comment)">Reply</span>
                                <span class="tag edit" v-if="comment.user.id === session.user?.id" @click="editComment(comment)">Edit</span>
                            </ClientOnly>
                        </header>
                        <Markdown class="body p-3" v-if="commentToEdit !== comment.id" :content="comment.content" />
                        <div class="comment-reply field px-3 pb-3" v-if="commentToReplyTo === comment.id">
                            <textarea class="textarea" rows="2" v-model="commentReply"></textarea>
                            <div class="row-fit g-1 pt-2">
                                <span class="tag success" @click="submitComment(comment, commentReply)">Submit</span>
                                <span class="tag danger" @click="replyToComment(comment)">Cancel</span>
                            </div>
                        </div>
                        <div class="comment-reply field px-3 pb-3 mt-2" v-if="commentToEdit === comment.id">
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
    </article>
</template>

<style scoped lang="scss">
article#post {
    @include fit-width(800px, 1rem);
}

.post, .comments {
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
}

.tags {
    .topic { flex: 10 1 1rem }
    .info { flex: 1 1 }
}

div.not-logged-in {
    white-space: break-spaces;
}

div.sorting {
    button.selected {
        color: $dox-white-ultra;
        background-color: $dox-grey-light;
    }
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
