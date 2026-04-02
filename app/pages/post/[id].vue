<script setup lang="ts">
import ExtraOptions from "./components/ExtraOptions.vue"
import CommentSection from "./components/CommentSection.vue"
import type { Post, Comment } from '@@/shared/types'

const route = useRoute()
const cache = useCache()
const hints = useHints()
const events = useEvents()
const session = getSession()
const settings = useSettings()

const id = route.params.id?.toString()
await useDatasource(`/api/post/${id}/visit`)

const sortBy = cache.get<string>("comments.sort", () => "new")
const { data: post, status, refresh } = await useDatasource<Post>(`/api/post/${id}`, {
    query: {
        sortBy: sortBy
    }
})

async function refreshPost(sortType: string) {
    if (sortType == sortBy.value) {
        await refresh()
    }
    sortBy.value = sortType
}

useSeoMeta({
    ogType: "article",
    title: () => post.value?.title,
    ogTitle: () => post.value?.title,
    author: () => post.value ? post.value.user.name : 'unknown',
    description: () => post.value?.content.slice(0, 256),
    ogDescription: () => post.value?.content.slice(0, 256),
    ogImage: () => post.value?.images?.[0]?.url ?? '',
})


let editingPost = ref(false)
function toggleEditPost() {
    editingPost.value = !editingPost.value
}

// const showPreview = ref(false)
// function togglePreview() {
//     showPreview.value = !showPreview.value
// }

async function updatePost(changedPost: Post | null) {
    if (!changedPost) {
        hints.addError("You can't edit something that doesn't exist.")
        return
    }

    try {
        submitting.value = true
        await useApi(`/api/post/${id}/edit`, {
            body: {
                content: post.value?.content
            }
        })
        post.value!.edited = true
        toggleEditPost()
    }
    catch (error: any) {
        hints.addError(error.message)
    }
    finally {
        submitting.value = false
    }
}

async function deletePost() {
    events.publish(Trigger.showPopup, {
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete your post?',
        accept: async () => {
            await useApi(`/api/post/${id}/delete`)
            hints.addSuccess("Successfully deleted post.")
            return navigateTo("/feed")
        },
    })
}

let showCommentBox = ref(false)
function toggleCommentBox() {
    showCommentBox.value = !showCommentBox.value
}

let comment = ref("")
const submitting = ref<boolean>(false)
async function submitComment(replyTo: Post | Comment, content: string) {
    if (!session.isAuthenticated) {
        hints.addError("You must be logged in to interact with others.")
        return
    }

    submitting.value = true
    await useApi<Comment>("/api/comment/add", {
        body: {
            time: new Date(),
            user: session.user.id,
            post: post.value?.id,
            replyTo: replyTo.id,
            content: content,
            votes: {
                positive: [session.user!.id],
                misleading: [],
                negative: [],
            },
        }
    })
    submitting.value = false

    await refresh()
    comment.value = ""
    showCommentBox.value = false
}

function copyLink() {
    const postLink = window.location.href
    navigator.clipboard.writeText(postLink)
    hints.addSuccess("Copied post URL")
}

async function awardPost() {
    if (post.value?.user.id == session.user.id) {
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
            await useApi(`/api/post/${id}/award`)
            hints.addSuccess("Successfully awarded post.")
            await refresh()
        },
    })
}

function writePostReply() {
    if (!session.isAuthenticated) {
        hints.addError("You must be logged in to interact with others.")
        return
    }
    return navigateTo(`/editor/posts?replyTo=${extractId(post.value!.id)}`)
}

async function reportPost() {
    await useApi(`/api/post/${id}/report`)
    hints.addError("This post has been reported to the development team.")
}

async function archivePost() {
    await useApi(`/api/post/${id}/archive`)
    hints.addSuccess("This post has been archived.")
    await refresh()
}

async function pinPost() {
    await useApi(`/api/post/${id}/pin`)
    hints.addSuccess("This post has been pinned.")
}

const showOptions = ref<boolean>(false)
function toggleOptions() {
    showOptions.value = !showOptions.value
}

const showTopics = computed(() => {
    return settings.app.topics.enabled && post.value && post.value.topics.length > 0
})
</script>

<template>
    <article v-if="post" class="column g-2 p-4">
        <div class="container box background br-medium column">
            <aside v-if="post.replyTo && post.replyTo.id" class="reply-to row inline g-2" @click="navigateTo(`/post/${extractId(post.replyTo.id)}`)">
                <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                <p class="text truncate bold">{{ post.replyTo.title }}</p>
            </aside>
            <section class="post box br-medium p-5">
                <header class="tags row wrap g-1">
                    <Votes :target="post" />
                    <Tag v-if="post.archived" type="link" icon="fa-folder-closed" />
                    <UserTag class="f-1" :user="post.user" />
                    <Tag class="f-1" type="info" icon="fa-chart-simple" :label="post.visits" />
                    <Tag class="f-1" type="info">
                        <i class="fa-solid fa-stopwatch"></i>
                        {{ formatDate(post.time) }}
                        <template v-if="post.edited">
                            <i class="fa-solid fa-eraser"></i>
                            {{ formatDate(post.timeEdited) }}
                        </template>
                    </Tag>
                    <template v-if="showTopics" class="row wrap f-1 g-1">
                        <TopicTag v-for="topic in post.topics" :topic="topic" />
                    </template>
                </header>
                <h1 class="mt-2">
                    {{ post.title }}
                </h1>
                <Markdown v-if="!editingPost"
                    class="content my-4"
                    :content="post.content" 
                />
                <ClientOnly>
                    <div v-if="editingPost && post.user.id === session.user.id" class="field my-4">
                        <textarea rows="10" v-model="post.content" />
                    </div>
                </ClientOnly>
                <footer class="column g-2">
                    <div v-if="!showCommentBox && !editingPost" class="interactions row wrap g-1">
                        <button class="comment" @click="toggleCommentBox">
                            <i class="fa-solid fa-comment"></i>
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
                        <ClientOnly>
                            <button v-if="session.isAuthenticated" class="options" @click="toggleOptions">
                                <i class="fa-solid fa-ellipsis"></i>
                            </button>
                            <ExtraOptions
                                v-if="showOptions"
                                :post="post"
                                @edit="toggleEditPost"
                                @award="awardPost"
                                @report="reportPost"
                                @delete="deletePost"
                                @archive="archivePost"
                                @pin="pinPost"
                                @close="showOptions = false"
                            />
                        </ClientOnly>
                    </div>
                    <div class="row g-1" v-else-if="editingPost">
                        <ButtonSpinner class="success f-1" :loading="submitting" @click="updatePost(post)">
                            <i class="fa-solid fa-folder-open"></i>
                            <span>Save</span>
                        </ButtonSpinner>
                        <!-- <button class="info f-1" @click="togglePreview">
                            <i v-if="!showPreview" class="fa-solid fa-eye"></i>
                            <i v-else class="fa-solid fa-eye-slash"></i>
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
                            <ButtonSpinner class="success f-1" :loading="submitting" @click="submitComment(post, comment)">
                                <i class="fa-solid fa-comment"></i>
                                <span>Submit</span>
                            </ButtonSpinner>
                            <button class="danger" @click="toggleCommentBox">
                                <i class="fa-solid fa-ban"></i>
                                <span>Cancel</span>
                            </button>
                        </div>
                    </div>
                </footer>
            </section>
        </div>
        <CommentSection
            :post="post"
            :sort-type="sortBy"
            :loading="status"
            @refresh="refreshPost"
        />
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

aside.reply-to {
    padding: 0.5rem 0.75rem;
    color: $white-0;
    cursor: pointer;
}

aside.reply-to + section.post {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

section.post {
    @media (max-width: $bp-tablet) {
        padding: 1rem !important;
    }
}

div.interactions {
    button:not(.options) {
        flex: 1 1 auto;
    }

    @media (max-width: $bp-mobile) {
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

</style>
