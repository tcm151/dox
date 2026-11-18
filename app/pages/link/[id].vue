<script setup lang="ts">
import type { Comment, Link } from "@@/shared/types"
import CommentSection from "../post/components/CommentSection.vue"

const route = useRoute()
const cache = useCache()
const hints = useHints()
const events = useEvents()
const session = getSession()
const slowMode = useSlowMode()

const id = route.params.id?.toString()
await useDatasource(`/api/link/${id}/visit`)

const sortBy = cache.get<string>("comments.sort", () => "new")
const { data: link, status, refresh } = await useDatasource<Link>(`/api/link/${id}`, {
    query: { sortBy },
})
const commentState = slowMode.submissionState(() => link.value)
const displayDescription = computed(() => link.value?.description.trim() || link.value?.preview.description || "")
const domain = computed(() => {
    try {
        return new URL(link.value?.url ?? "").hostname.replace(/^www\./i, "")
    }
    catch {
        return link.value?.url ?? ""
    }
})
const imageUrl = computed(() => {
    const source = link.value?.preview.imageUrl
    if (!source) return

    try {
        const image = new URL(source)
        if (image.protocol !== "https:" || image.username || image.password || image.port) return
        return image.href
    }
    catch {
        return
    }
})

useSeoMeta({
    ogType: "article",
    title: () => link.value?.title,
    ogTitle: () => link.value?.title,
    description: () => displayDescription.value || link.value?.preview.title || link.value?.url,
    ogDescription: () => displayDescription.value || link.value?.preview.title || link.value?.url,
})

const showCommentBox = ref(false)
const showOptions = ref(false)
const editingDescription = ref(false)
const savingDescription = ref(false)
const editedDescription = ref("")
const comment = ref("")
const submitting = ref(false)

function toggleDescriptionEdit() {
    editingDescription.value = !editingDescription.value
    if (editingDescription.value) editedDescription.value = link.value?.description ?? ""
}

async function saveDescription() {
    if (!link.value || savingDescription.value) return

    savingDescription.value = true
    try {
        await useApi(`/api/link/${id}/edit`, { body: { description: editedDescription.value } })
        hints.addSuccess("Link description updated.")
        editingDescription.value = false
        await refresh()
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
    finally {
        savingDescription.value = false
    }
}

function toggleCommentBox() {
    if (!showCommentBox.value && commentState.value.disabled) {
        if (commentState.value.warning) hints.addWarning(commentState.value.warning)
        return
    }
    showCommentBox.value = !showCommentBox.value
    if (!showCommentBox.value) comment.value = ""
}

async function submitComment() {
    if (submitting.value || !link.value) return
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
                user: session.user.id,
                context: link.value.id,
                replyTo: link.value.id,
                content: comment.value,
                votes: {
                    positive: [session.user.id],
                    misleading: [],
                    negative: [],
                },
            },
        })
        slowMode.recordSubmission(link.value.id)
        await refresh()
        comment.value = ""
        showCommentBox.value = false
    }
    catch (error: any) {
        const statusCode = error?.statusCode ?? error?.response?.status
        if (statusCode === 409 || statusCode === 429) hints.addWarning(error.message)
        else hints.addError(error.message, error)
    }
    finally {
        submitting.value = false
    }
}

function refreshLink(sortType: string) {
    if (sortType === sortBy.value) refresh()
    sortBy.value = sortType
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    hints.addSuccess("Copied link URL")
}

function reportLink() {
    if (link.value) submitReport(link.value.id)
}

function deleteLink() {
    if (!link.value) return
    const linkId = extractId(link.value.id)

    events.publish(Trigger.showPopup, {
        title: "Confirm Deletion",
        message: "Are you sure you want to delete your link?",
        accept: async () => {
            await useApi(`/api/link/${linkId}/delete`)
            hints.addSuccess("Successfully deleted link.")
            return navigateTo("/feed")
        },
    })
}

async function awardLink() {
    const currentLink = link.value
    if (!currentLink) return
    if (currentLink.user.id === session.user.id) {
        hints.addWarning("You can't award your own links.")
        return
    }
    if (currentLink.votes.awards?.includes(session.user.id)) {
        hints.addWarning("You have already awarded this link.")
        return
    }
    if (session.user.tokens < 256) {
        hints.addWarning("You don't have enough tokens.")
        return
    }

    events.publish(Trigger.showPopup, {
        title: "Confirm Award",
        message: "Are you sure you want to award this link? It will cost 256 tokens.",
        accept: async () => {
            await useApi(`/api/link/${extractId(currentLink.id)}/award`)
            hints.addSuccess("Successfully awarded link.")
            await refresh()
        },
    })
}

async function archiveLink() {
    const currentLink = link.value
    if (!currentLink) return
    await useApi(`/api/link/${extractId(currentLink.id)}/archive`)
    hints.addSuccess(currentLink.status === "archived" ? "Link unarchived." : "Link archived.")
    await refresh()
}

async function pinLink() {
    if (!link.value) return
    await useApi(`/api/link/${extractId(link.value.id)}/pin`)
    hints.addSuccess("This link has been pinned.")
}
</script>

<template>
    <article v-if="link" class="content-width column g-2 p-4">
        <div class="box background br-medium column">
            <section class="link-detail box br-medium p-5">
                <ContentHeader :content="link" />
                <ContentVisibility :tags="link.tags" direct>
                    <h1 class="mt-2">{{ link.title }}</h1>
                    <p class="description mt-3">
                        <span v-if="displayDescription && !editingDescription" class="mr-3">{{ displayDescription }} </span>
                        <a class="destination" :href="link.url" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">
                            <i class="fa-solid fa-arrow-up-right-from-square mr-1"></i>
                            {{ domain }}
                        </a>
                    </p>
                    <MarkdownEditor v-if="editingDescription" class="mt-3" :rows="5" :max-length="256" v-model="editedDescription" />
                    <img
                        v-if="imageUrl"
                        class="link-image mt-3"
                        :src="imageUrl"
                        :alt="link.preview.title || link.title"
                        loading="lazy"
                        decoding="async"
                        referrerpolicy="no-referrer"
                    >
                </ContentVisibility>
                <footer class="column g-2 mt-3">
                    <div v-if="!editingDescription" class="interactions row wrap g-1">
                        <button class="comment" :disabled="commentState.disabled" @click="toggleCommentBox">
                            <i class="fa-solid fa-comment"></i>
                            <span>Comment</span>
                        </button>
                        <button class="share" @click="copyLink">
                            <i class="fa-solid fa-copy"></i>
                            <span>Share</span>
                        </button>
                        <ClientOnly>
                            <button v-if="session.isAuthenticated" class="options" title="Options" @click="showOptions = !showOptions">
                                <i class="fa-solid fa-ellipsis"></i>
                            </button>
                            <OverlayTransition>
                                <ExtraOptions
                                    v-if="showOptions"
                                    :target="link"
                                    @updated="refresh"
                                    @edit="toggleDescriptionEdit"
                                    @delete="deleteLink"
                                    @report="reportLink"
                                    @award="awardLink"
                                    @archive="archiveLink"
                                    @pin="pinLink"
                                    @close="showOptions = false"
                                />
                            </OverlayTransition>
                        </ClientOnly>
                    </div>
                    <div v-if="editingDescription" class="row g-1">
                        <ButtonSpinner class="success f-1" :loading="savingDescription" @click="saveDescription">
                            <i class="fa-solid fa-floppy-disk"></i>
                            <span>Save</span>
                        </ButtonSpinner>
                        <button class="danger" @click="toggleDescriptionEdit">
                            <i class="fa-solid fa-ban"></i>
                            <span>Cancel</span>
                        </button>
                    </div>
                    <p v-if="!showCommentBox && commentState.warning" class="warning" role="status">{{ commentState.warning }}</p>
                    <CollapseTransition>
                        <div v-if="showCommentBox" class="column g-2">
                            <MarkdownEditor :rows="5" v-model="comment" />
                            <div class="row g-2">
                                <ButtonSpinner class="success f-1" :loading="submitting" :disabled="commentState.disabled" @click="submitComment">
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
        <ContentVisibility v-if="link.comments.length > 0" :tags="link.tags" direct>
            <CommentSection :target="link" :sort-type="sortBy" :loading="status" @refresh="refreshLink" />
        </ContentVisibility>
    </article>
    <article v-else class="content-width column p-4">
        <footer class="box text center p-4">
            There is nothing here.
        </footer>
    </article>
</template>

<style scoped lang="scss">
.interactions button {
    flex: 1 1 auto;
}

.link-detail {
    min-width: 0;

    .description {
        color: $white-3;
        overflow-wrap: anywhere;
    }

    .destination {
        display: inline-block;
        color: $blue;
        font-weight: var(--fw-bold);
        text-decoration: none;
        overflow-wrap: anywhere;

        &:visited {
            color: $purple;
        }

        i {
            font-size: 0.85rem;
        }
    }

    .link-image {
        max-width: 100%;
        max-height: 640px;
        object-fit: contain;
        border: 1px solid $white-1;
        border-radius: 0.25rem;
    }
}
</style>
