<script setup lang="ts">
import ExtraOptions from "./components/ExtraOptions.vue"
import CommentSection from "./components/CommentSection.vue"
import type { Post, Comment, User } from '~/types'

const route = useRoute()
const postId = route.params.postId.toString()

const { data: post, pending, refresh } = useAsyncData(`post:${postId}`, () => {
    return $fetch<Post>(`/api/post/${postId}`)
})

useSeoMeta({
    title: () => post.value?.title ?? 'DOX For Everything',
    ogTitle: () => post.value?.title,
    author: () => post.value ? (post.value.user as User).name : 'unknown',
    description: () => post.value?.content.slice(0, 256),
    ogDescription: () => post.value?.content.slice(0, 256),
    // ogImage: () => post.value?.images?.[0].url ?? '',
})

useServerSeoMeta({
    robots: {
        index: true,
    },
    ogType: 'article',
    ogSiteName: 'DOX For Everything',
})

onMounted(async () => {
    if (process.client && post.value) {
        // sortList(post.value.comments as Comment[], "hot")
        await $fetch(`/api/post/${postId}/visit`)
    }
})

const hints = useHints()
const events = useEvents()
const session = getSession()

let editingPost = ref(false)
function toggleEditPost() {
    editingPost.value = !editingPost.value;
}

// const showPreview = ref(false)
// function togglePreview() {
//     showPreview.value = !showPreview.value
// }

async function updatePost(changes: Post | null) {
    if (!changes) {
        hints.addError("You can't edit something that doesn't exist.")
        return
    }

    try {
        await session.useApi(`/api/post/${postId}/edit`, { content: post.value?.content })
        post.value!.edited = true
        toggleEditPost()
    }
    catch (ex: any) {
        hints.addError("Failed to save changes to post.")
    }
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

let showCommentBox = ref(false)
function toggleCommentBox() {
    showCommentBox.value = !showCommentBox.value
}

let comment = ref("")
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

    await refresh()
    comment.value = ""
    showCommentBox.value = false
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
                await refresh()
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

async function reportPost() {
    await session.useApi(`/api/post/${postId}/report`)
    hints.addError("This post has been reported to the development team.")
}

async function pinPost() {
    await session.useApi(`/api/post/${postId}/pin`)
    hints.addSuccess("This post has been pinned.")
}

const showOptions = ref<boolean>(false)
function toggleOptions() {
    showOptions.value = !showOptions.value
}
</script>

<template>
    <article class="column g-2 p-4">
        <div class="container column" v-if="post">
            <aside 
                v-if="(post.replyTo as Post).id != null"
                class="reply-to row center-inline g-2"
                @click="navigateTo(`/post/${extractId((post.replyTo as Post).id)}`)"
            >
                <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                <p>{{ (post.replyTo as Post).title }}</p>
            </aside>
            <section class="post p-5">
                <header class="tags row-wrap g-1">
                    <Votes :target="post" />
                    <TopicTag v-for="topic in post.topics" :topic="topic" />
                    <UserTag :fill="1" :user="(post.user as User)" />
                    <TimeTag :fill="1" :time="post.time" />
                    <Tag :fill="1" type="info" icon="fa-chart-simple" :label="post.visits ?? 0" />
                    <Tag :fill="1" v-if="post.timeEdited" type="danger" icon="fa-eraser" :label="formatDate(post.timeEdited)" />
                </header>
                <h1 class="mt-2">
                    {{ post.title }}
                </h1>
                <Markdown v-if="!editingPost"
                    class="content my-4"
                    :content="post.content" 
                />
                <div v-if="editingPost && (post.user as User).id === session.user.id" class="field my-4">
                    <textarea rows="10" v-model="post.content" />
                </div>
                <ClientOnly>
                    <footer class="column g-2" v-if="session.isAuthenticated">
                        <div class="interactions row-wrap g-1" v-if="!showCommentBox && !editingPost">
                            <button class="comment" @click="toggleCommentBox">
                                <i class="fa-solid fa-message"></i>
                                <span>Comment</span>
                            </button>
                            <button class="reply" @click="writePostReply">
                                <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                                <span>Reply</span>
                            </button>
                            <button class="share" @click="copyLink">
                                <i class="fa-solid fa-copy"></i>
                                <span>Share</span>
                            </button>
                            <button class="options" @click="toggleOptions">
                                <i class="fa-solid fa-ellipsis"></i>
                            </button>
                            <ExtraOptions
                                :post="post"
                                :visible="showOptions"
                                @pin-post="pinPost"
                                @award-post="awardPost"
                                @save-post="hints.addWarning('This is still being working on.')"
                                @report-post="reportPost"
                                @edit-post="toggleEditPost"
                                @delete-post="deletePost"
                                @close="showOptions = false"
                            />
                        </div>
                        <div class="row g-1" v-else-if="editingPost">
                            <button class="success fill" @click="updatePost(post)">
                                <i class="fa-solid fa-folder-open"></i>
                                <span>Save</span>
                            </button>
                            <!-- <button class="info fill" @click="togglePreview">
                                <i class="fa-solid fa-eye" v-if="!showPreview"></i>
                                <i class="fa-solid fa-eye-slash" v-else></i>
                                <span>Preview</span>
                            </button> -->
                            <button class="danger" @click="toggleEditPost()">
                                <i class="fa-solid fa-ban"></i>
                                <span>Cancel</span>
                            </button>
                        </div>
                        <div class="field" v-else-if="showCommentBox">
                            <textarea rows="5" v-model="comment"></textarea>
                            <div class="row g-2 mt-2">
                                <button class="success fill" @click="submitComment(post, comment)">
                                    <i class="fa-solid fa-message"></i>
                                    <span>Submit</span>
                                </button>
                                <button class="danger" @click="toggleCommentBox">
                                    <i class="fa-solid fa-ban"></i>
                                    <span>Cancel</span>
                                </button>
                            </div>
                        </div>
                    </footer>
                    <footer class="column not-logged-in" v-else>
                        <button class="danger">You must be logged in to interact with others.</button>
                    </footer>
                </ClientOnly>
                
            </section>
        </div>
        <InlineAd />
        <CommentSection v-if="post && post.comments && post.comments.length > 0" />
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);

    div.container {
        border-radius: 0.5rem 0.5rem;
        background-color: $dox-white-3;
    }
}

aside.reply-to {
    padding: 0.5rem 0.75rem;
    color: $dox-white-0;
    cursor: pointer;
    
    p {
        font-weight: 700;
        overflow-x: hidden;
        text-overflow: ellipsis;
    }
}

aside.reply-to + section.post {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

section.post {
    border-radius: 0.5rem;
    background-color: $dox-white-0;
    
    @media screen and (max-width: 600px) {
        padding: 1rem !important;
    }
}

div.interactions {
    button:not(.options) {
        flex: 1 1 auto;
    }

    @media screen and (max-width: 425px) {
        button:is(.reply, .share) {
            flex: 1 0;

            span {
                display: none;
            }
        }
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
