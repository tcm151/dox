<script setup lang="ts">
import CommentSection from "./components/CommentSection.vue"
import type { Comment, Post } from '@@/shared/types'
import { useSlowMode } from '@@/app/utils/slow'

const route = useRoute()
const cache = useCache()
const hints = useHints()
const events = useEvents()
const session = getSession()
const slowMode = useSlowMode()

const id = route.params.id?.toString()
await useDatasource(`/api/post/${id}/visit`)

const sortBy = cache.get<string>("comments.sort", () => "new")
const { data: post, status, refresh } = await useDatasource<Post>(`/api/post/${id}`, {
    query: {
        sortBy: sortBy
    }
})
const commentState = slowMode.submissionState(
    () => post.value,
)

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


const editingPost = ref(false)
const editedPostContent = ref("")

function startEditingPost() {
    editedPostContent.value = post.value?.content ?? ""
    editingPost.value = true
}

function cancelEditingPost() {
    editingPost.value = false
}

// const showPreview = ref(false)
// function togglePreview() {
//     showPreview.value = !showPreview.value
// }

async function updatePost(changedPost: Post | null) {
    if (!changedPost) {
        hints.addWarning("You can't edit something that doesn't exist.")
        return
    }

    try {
        submitting.value = true
        const updatedPost = await useApi<Pick<Post, "content" | "edited" | "timeEdited">>(`/api/post/${id}/edit`, {
            body: {
                content: editedPostContent.value,
            }
        })
        if (post.value) Object.assign(post.value, updatedPost)
        editingPost.value = false
    }
    catch (error: any) {
        hints.addError(error.message, error)
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
    if (!showCommentBox.value && commentState.value.disabled) return
    showCommentBox.value = !showCommentBox.value
    if (!showCommentBox.value) {
        comment.value = ""
    }
}

let comment = ref("")
const submitting = ref<boolean>(false)
async function submitComment(replyTo: { id: string }, content: string) {
    if (submitting.value) return
    if (!session.isAuthenticated) {
        hints.addWarning("You must be logged in to interact with others.")
        return
    }
    if (commentState.value.disabled) {
        if (commentState.value.warning) hints.addWarning(commentState.value.warning)
        return
    }

    submitting.value = true
    try {
        await useApi("/api/comment/add", {
            body: {
                time: new Date(),
                user: session.user.id,
                context: post.value?.id,
                replyTo: replyTo.id,
                content: content,
                votes: {
                    positive: [session.user!.id],
                    misleading: [],
                    negative: [],
                },
            }
        })

        if (post.value) slowMode.recordSubmission(post.value.id)
        await refresh()
        comment.value = ""
        showCommentBox.value = false
    }
    catch (error: any) {
        const status = error?.statusCode ?? error?.response?.status
        if (status === 409 || status === 429) hints.addWarning(error.message)
        else hints.addError(error.message, error)
    }
    finally {
        submitting.value = false
    }
}

function copyLink() {
    const postLink = window.location.href
    navigator.clipboard.writeText(postLink)
    hints.addSuccess("Copied post URL")
}

async function awardPost() {
    if (post.value?.user.id == session.user.id) {
        hints.addWarning("You can't award your own posts.")
        return
    }
    if (post.value?.votes.awards?.includes(session.user.id)) {
        hints.addWarning('You have already awarded this post.')
        return
    }
    if (session.user.tokens < 256) {
        hints.addWarning("You don't have enought tokens.")
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
        hints.addWarning("You must be logged in to interact with others.")
        return
    }
    return navigateTo(`/editor/post?replyTo=${extractId(post.value!.id)}`)
}

async function reportPost() {
    if (!post.value) return
    submitReport(post.value.id)
}

async function archivePost() {
    const wasArchived = post.value?.status === "archived"
    await useApi(`/api/post/${id}/archive`)
    hints.addSuccess(wasArchived ? "This post has been unarchived." : "This post has been archived.")
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
</script>

<template>
    <article v-if="post" class="content-width column g-2 p-4">
        <div class="box background br-medium column">
            <ContentVisibility v-if="post.replyTo && post.replyTo.id" :tags="post.replyTo.tags" direct>
                <aside class="reply-to clickable row inline g-2 py-2 px-3" @click="navigateTo(`/post/${extractId(post.replyTo.id)}`)">
                    <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                    <p class="text truncate bold">{{ post.replyTo.title }}</p>
                </aside>
            </ContentVisibility>
            <section class="post box br-medium p-5">
                <ContentHeader :content="post" />
                <ContentVisibility :tags="post.tags" direct>
                    <h1 class="mt-2">
                        {{ post.title }}
                    </h1>
                    <Markdown v-if="!editingPost"
                        class="content my-4"
                        :content="post.content"
                    />
                </ContentVisibility>
                <ClientOnly>
                    <template v-if="editingPost && post.user.id === session.user.id">
                        <MarkdownEditor class="my-4" :rows="10" v-model="editedPostContent" />
                    </template>
                </ClientOnly>
                <footer class="column g-2">
                    <div v-if="!editingPost" class="interactions row wrap g-1">
                            <button class="comment" :disabled="commentState.disabled" @click="toggleCommentBox">
                                <i class="fa-solid fa-comment"></i>
                                <span>Comment</span>
                            </button>
                            <button class="reply" :disabled="commentState.disabled" @click="writePostReply">
                                <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                                <span>Reply</span>
                            </button>
                            <button class="share" @click="copyLink">
                                <i class="fa-solid fa-copy"></i>
                                <span>Share</span>
                            </button>
                            <ClientOnly>
                                <button v-if="session.isAuthenticated" class="options" title="Options" @click="toggleOptions">
                                    <i class="fa-solid fa-ellipsis"></i>
                                </button>
                                <OverlayTransition>
                                    <ExtraOptions
                                        v-if="showOptions"
                                        :target="post"
                                        @updated="refresh"
                                        @edit="startEditingPost"
                                        @award="awardPost"
                                        @report="reportPost"
                                        @delete="deletePost"
                                        @archive="archivePost"
                                        @pin="pinPost"
                                        @close="showOptions = false"
                                    />
                                </OverlayTransition>
                            </ClientOnly>
                    </div>
                    <p v-if="!showCommentBox && !editingPost && commentState.warning" class="warning" role="status">{{ commentState.warning }}</p>
                    <div v-if="editingPost" class="row g-1">
                        <ButtonSpinner class="success f-1" :loading="submitting" @click="updatePost(post)">
                            <i class="fa-solid fa-folder-open"></i>
                            <span>Save</span>
                        </ButtonSpinner>
                        <!-- <button class="info" @click="togglePreview">
                            <i v-if="!showPreview" class="fa-solid fa-eye"></i>
                            <i v-else class="fa-solid fa-eye-slash"></i>
                            <span>Preview</span>
                        </button> -->
                        <button class="danger" @click="cancelEditingPost">
                            <i class="fa-solid fa-ban"></i>
                            <span>Cancel</span>
                        </button>
                    </div>
                    <CollapseTransition>
                        <div v-if="showCommentBox && !editingPost" class="column g-2">
                            <MarkdownEditor :rows="5" v-model="comment" />
                            <p v-if="commentState.warning" class="warning" role="status">{{ commentState.warning }}</p>
                            <div class="row g-2">
                                <ButtonSpinner class="success f-1" :loading="submitting" :disabled="commentState.disabled" @click="submitComment(post, comment)">
                                    <i class="fa-solid fa-comment"></i>
                                    <span>Submit</span>
                                </ButtonSpinner>
                                <button class="danger" @click="toggleCommentBox">
                                    <i class="fa-solid fa-ban"></i>
                                    <span>Cancel</span>
                                </button>
                            </div>
                        </div>
                    </CollapseTransition>
                </footer>
            </section>
        </div>
        <ContentVisibility v-if="post.comments.length > 0" :tags="post.tags" direct>
            <CommentSection
                :target="post"
                :sort-type="sortBy"
                :loading="status"
                @refresh="refreshPost"
            />
        </ContentVisibility>
    </article>
    <article v-else class="content-width column p-4">
        <footer class="box text center p-4">
            There is nothing here.
        </footer>
    </article>
</template>

<style scoped lang="scss">
aside.reply-to {
    color: $white-0;
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
</style>
