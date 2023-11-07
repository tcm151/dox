<script setup lang="ts">
import CommentSection from "./components/CommentSection.vue"
import type { Post, Comment, User } from '~/types'

const route = useRoute();
const postId = route.params.postId.toString();
const { post, comments } = usePost(postId)

useSeoMeta({
    title: () => post.value?.title ?? 'DOX For Everything',
    ogTitle: () => post.value?.title,
    author: () => post.value ? (post.value.user as User).name : 'unknown',
    description: () => post.value?.content.slice(0, 256),
    ogDescription: () => post.value?.content.slice(0, 256),
    ogImage: () => post.value?.images?.[0].url,
})

useServerSeoMeta({
    robots: {
        index: true,
    },
    ogType: 'article',
    ogSiteName: 'DOX For Everything',
})

onMounted(async () => {
    sortBy(comments.items!, "hot")
    await $fetch(`/api/post/${postId}/visit`)
})

const vote = useVoting()
const hints = useHints()
const events = useEvents()
const session = getSession()

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

const showPreview = ref(false)
function togglePreview() {
    showPreview.value = !showPreview.value
}

async function deletePost() {
    events.publish(Trigger.showPopup, {
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete your post?',
        accept: async () => {
            try {
                await session.useApi(`/api/post/${postId}/delete`)
                return navigateTo("/feed")
            }
            catch (ex: any) {
                hints.addError("Failed to delete post.")
            }
        },
    })
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

    postReply.value = ""
    showPostReply.value = false
}

function copyLink() {
    const postLink = window.location.href
    navigator.clipboard.writeText(postLink);
    hints.addSuccess("Copied post URL");
}

async function awardPost() {
    if ((post.value?.user as User).id == session.user.id) {
        hints.addError("You can't award your own posts.")
        return
    }
    if (post.value?.votes.awards?.includes(session.user.id)) {
        hints.addWarning('You have already awarded this post.')
        return
    }

    events.publish(Trigger.showPopup, {
        title: 'Confirm Award',
        message: 'Are you sure you want to award this post? It will cost 256 tokens.',
        accept: async () => {
            try {
                await session.useApi(`/api/post/${postId}/award`)
                await post.fetch()
            }
            catch (ex: any) {
                hints.addError("Failed to award post.")
            }
        },
    })
}

function writePostReply() {
    return navigateTo(`/editor?replyTo=${extractId(post.value?.id)}`)
}

async function reportPost(post: Post) {
    await session.useApi(`/api/post/${postId}/report`)
    hints.addError("This post has been reported to the development team.")
}
</script>

<template>
    <article class="column g-2 p-4">
        <div class="container column" v-if="post.value">
            <div 
                v-if="(post.value.replyTo as Post).id != null"
                class="reply-to row center-inline g-2"
                @click="navigateTo(`/post/${extractId((post.value.replyTo as Post).id)}`)"
            >
                <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                <p>{{ (post.value.replyTo as Post).title }}</p>
            </div>
            <section class="post p-5">
                <header class="tags row-wrap g-1">
                    <div class="fit row g-1">
                        <span class="tag positive" @click="vote.positive(post.value)" :class="{ voted: post.value.votes.positive.includes(session.user.id)}">
                            {{ post.value?.votes.positive.length }}
                        </span>
                        <span class="tag misleading" @click="vote.misleading(post.value)" :class="{ voted: post.value.votes.misleading.includes(session.user.id)}">
                            {{ post.value?.votes.misleading.length }}
                        </span>
                        <span class="tag negative" @click="vote.negative(post.value)" :class="{ voted: post.value.votes.negative.includes(session.user.id)}">
                            {{ post.value?.votes.negative.length }}
                        </span>
                        <span class="tag link" v-if="post.value.votes.awards && post.value.votes.awards.length > 0">
                            <i class="fa-solid fa-crown"></i>
                            <span>{{ post.value.votes.awards.length }}</span>
                        </span>
                        <span class="tag link" v-if="post.value.votes.saves && post.value.votes.saves.length > 0">
                            <i class="fa-solid fa-box-archive"></i>
                            <span>{{ post.value.votes.saves.length }}</span>
                        </span>
                    </div>
                    <span class="tag topic" v-for="topic in post.value?.topics" @click="navigateTo(`/topic/${topic.split(':')[1]}`)">
                        {{ topic.split(':')[1] }}
                    </span>
                    <span class="tag info" @click="navigateTo(`/user/${extractId((post.value.user as User).id)}`)">
                        <i class="fa-solid fa-user"></i>
                        <span>{{ (post.value.user as User).name ?? "deleted" }}</span>
                    </span>
                    <ClientOnly>
                        <span class="tag info">
                            <i class="fa-solid fa-calendar"></i>
                            <span>{{ formatDate(post.value.time as any) }}</span>
                        </span>
                        <span class="tag info">
                            <i class="fa-solid fa-chart-simple"></i>
                            <span>{{ post.value.visits ?? 0 }}</span>
                        </span>
                        <span class="tag danger" v-if="post.value?.edited">
                            <i class="fa-solid fa-eraser"></i>
                            <span>{{ formatDate(post.value?.timeEdited!) }}</span>
                        </span>
                    </ClientOnly>
                </header>
                <h2 class="mt-4">
                    {{ post.value?.title }}
                </h2>
                <Markdown class="content my-4" :content="post.value?.content" v-if="!editingPost" />
                <div class="field my-4" v-if="post.value && editingPost && (post.value.user as User).id === session.user?.id">
                    <textarea rows="10" v-model="post.value.content"></textarea>
                </div>
                <ClientOnly>
                    <footer class="column g-2" v-if="session.isAuthenticated">
                        <div class="interactions row-wrap g-1" v-if="!showPostReply && !editingPost">
                            <div class="first row g-1">
                                <button class="comment" @click="toggleCommentBox">
                                    <i class="fa-solid fa-message"></i>
                                    <span>Comment</span>
                                </button>
                                <button class="reply" @click="writePostReply">
                                    <i class="fa-solid fa-reply-all"></i>
                                    <span>Reply</span>
                                </button>
                                <button class="share" @click="copyLink">
                                    <i class="fa-solid fa-copy"></i>
                                    <span>Share</span>
                                </button>
                            </div>
                            <div class="second row g-1">
                                <button class="award" @click="awardPost">
                                    <i class="fa-solid fa-crown"></i>
                                    <span>Award</span>
                                </button>
                                <!-- TODO allow saving posts -->
                                <button class="save" @click="hints.addWarning('This is still being working on.')">
                                    <i class="fa-solid fa-box-archive"></i>
                                    <span>Save</span>
                                </button>
                                <button class="report" @click="reportPost(post.value!)">
                                    <i class="fa-solid fa-flag"></i>
                                    <span>Report</span>
                                </button>
                            </div>
                            <div class="third row g-1" v-if="(post.value.user as User).id === session.user?.id">
                                <button class="edit" @click="toggleEditPost()">
                                    <i class="fa-solid fa-eraser"></i>
                                    <span>Edit</span>
                                </button>
                                <button class="delete" @click="deletePost">
                                    <i class="fa-solid fa-trash-can"></i>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                        <div class="row g-1" v-else-if="editingPost">
                            <button class="info" @click="togglePreview">
                                <i class="fa-solid fa-eye" v-if="!showPreview"></i>
                                <i class="fa-solid fa-eye-slash" v-else></i>
                                <span>Preview</span>
                            </button>
                            <button class="link" @click="updatePost(post.value)">
                                <i class="fa-solid fa-folder-open"></i>
                                <span>Save</span>
                            </button>
                            <button class="danger" @click="toggleEditPost()">
                                <i class="fa-solid fa-ban"></i>
                                <span>Cancel</span>
                            </button>
                        </div>
                        <div class="field" v-else-if="showPostReply">
                            <textarea rows="5" v-model="postReply"></textarea>
                            <div class="row g-2 mt-2">
                                <button class="success" @click="submitComment(post.value!, postReply)">Submit</button>
                                <button class="danger" @click="toggleCommentBox">Cancel</button>
                            </div>
                        </div>
                    </footer>
                    <div class="row not-logged-in" v-else>
                        <button class="danger fill">You must be logged in to interact with others.</button>
                    </div>
                </ClientOnly>
            </section>
        </div>
        <CommentSection v-if="comments.items && comments.items.length > 0" />
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);

    div.container {
        border-radius: 0.5rem 0.5rem;
        background-color: $dox-white-3;
    }
}

.reply-to {
    padding: 0.5rem 0.75rem;
    font-weight: 700;
    color: $dox-white-0;
    cursor: pointer;

    p {
        overflow-x: hidden;
        text-overflow: ellipsis;
    }
}

section.post {
    border-radius: 0.5rem;
    background-color: $dox-white-0;
    
    @media screen and (max-width: 600px) {
        padding: 1rem !important;
    }
}

.reply-to + section.post {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

div.interactions {
    position: relative;

    button:not(.menu) {
        flex: 1 1 auto;
    }

    div.first, div.second, div.third {
        flex: 1 1 auto;
    }
}

header.tags {
    .topic { flex: 10 1 1rem }
    .info { flex: 1 1 }
}

div.not-logged-in {
    white-space: break-spaces;
}
</style>
