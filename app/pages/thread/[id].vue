<script setup lang="ts">
import ThreadChain from './components/ThreadChain.vue'
import type { Thread } from '@@/shared/types'
import { useSlowMode } from '@@/app/utils/slow'

const route = useRoute()
const hints = useHints()
const events = useEvents()
const session = getSession()
const slowMode = useSlowMode()

const id = route.params.id?.toString()
await useDatasource(`/api/thread/${id}/visit`)

const { data: thread, refresh } = await useDatasource<Thread>(`/api/thread/${id}`)

function isThreadLoadMore(item: Thread): boolean {
    return item.id === "thread:load_more"
}

let editingThread = ref(false)
function toggleEditThread() {
    editingThread.value = !editingThread.value
}

// const showPreview = ref(false)
// function togglePreview() {
//     showPreview.value = !showPreview.value
// }

async function updateThread() {
    if (!thread.value) {
        hints.addWarning("You can't edit something that doesn't exist.")
        return
    }
    try {
        submitting.value = true
        await useApi(`/api/thread/${id}/edit`, {
            body: {
                content: thread.value.content,
            }
        })
        thread.value.edited = true
        toggleEditThread()
        await refresh()
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
    finally {
        submitting.value = false
    }
}

const showReplyBox = ref<boolean>(false)
const replyText = ref<string>("")
const replyTags = ref<string[]>([])

const quoting = ref<boolean>(false)
const replyState = slowMode.submissionState(() => thread.value)
const quoteState = slowMode.submissionState(() => thread.value, { quote: true })
const activeSubmissionState = computed(() => quoting.value ? quoteState.value : replyState.value)
const actionWarning = computed(() => quoteState.value.warning ?? replyState.value.warning)

function quoteThread() {
    if (quoteState.value.disabled) return
    showReplyBox.value = true
    quoting.value = true
}

function toggleReplyBox() {
    if (!showReplyBox.value && replyState.value.disabled) return
    showReplyBox.value = !showReplyBox.value
    if (showReplyBox.value) quoting.value = false
}

function cancelThreadReply() {
    showReplyBox.value = false
    quoting.value = false
    replyText.value = ""
    replyTags.value = []
}

const submitting = ref<boolean>(false)
const archiving = ref(false)
const showOptions = ref<boolean>(false)
async function submitThread() {
    if (submitting.value) return
    if (!session.isAuthenticated) {
        hints.addWarning("You must be logged in to interact with others.")
        return
    }
    if (activeSubmissionState.value.disabled) {
        if (activeSubmissionState.value.warning) hints.addWarning(activeSubmissionState.value.warning)
        return
    }
    
    submitting.value = true
    const action = (quoting.value) ? "quote" : "reply"
    try {
        await useApi<Thread>(`/api/thread/${id}/${action}`, {
            body: {
                user: session.user.id,
                content: replyText.value,
                tags: replyTags.value,
                votes: {
                    positive: [session.user.id],
                    misleading: [],
                    negative: [],
                },
            }
        })

        if (action === "reply" && thread.value) slowMode.recordSubmission(thread.value.id)
        replyText.value = ""
        replyTags.value = []
        showReplyBox.value = false
        refresh()
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

async function copyLink() {
    const postLink = window.location.href
    try {
        await navigator.clipboard.writeText(postLink)
        hints.addSuccess("Copied thread URL")
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
}

async function deleteThread() {
    events.publish(Trigger.showPopup, {
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete your thread?',
        accept: async () => {
            try {
                await useApi(`/api/thread/${id}/delete`)
                hints.addSuccess("Successfully deleted thread.")
                return navigateTo("/feed")
            }
            catch (error: any) {
                hints.addError(error.message, error)
            }
        },
    })
}

async function awardThread() {
    if (thread.value?.user.id == session.user.id) {
        hints.addWarning("You can't award your own threads.")
        return
    }
    if (thread.value?.votes.awards?.includes(session.user.id)) {
        hints.addWarning('You have already awarded this thread.')
        return
    }

    events.publish(Trigger.showPopup, {
        title: 'Confirm Award',
        message: 'Are you sure you want to award this thread? It will cost 256 tokens.',
        accept: async () => {
            try {
                await useApi(`/api/thread/${id}/award`)
                hints.addSuccess("Successfully awarded thread.")
                await refresh()
            }
            catch (error: any) {
                hints.addError(error.message, error)
            }
        },
    })
}

async function archiveThread() {
    if (archiving.value || !id) return

    archiving.value = true
    try {
        const updatedThread = await useApi<Thread>(`/api/thread/${id}/archive`)
        if (thread.value) thread.value.status = updatedThread.status
        hints.addSuccess(updatedThread.status === "archived" ? "This thread has been archived." : "This thread has been unarchived.")
        showOptions.value = false
    }
    catch (error: any) {
        const status = error?.statusCode ?? error?.status ?? error?.response?.status
        if (status === 409) hints.addWarning(error.message)
        else hints.addError(error.message, error)
        return
    }
    finally {
        archiving.value = false
    }

    await refresh()
}

async function pinThread() {
    try {
        await useApi(`/api/thread/${id}/pin`)
        hints.addSuccess("This thread has been pinned.")
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
}

function toggleOptions() {
    showOptions.value = !showOptions.value
}

</script>

<template>
    <article v-if="thread" class="content-width column p-4">
        <ThreadChain v-if="thread.ancestors?.length" class="mb-2" :threads="thread.ancestors" load-more-label="Earlier context omitted" />
        <section class="main box column px-4 pt-4">
            <ContentHeader :content="thread" context="detail" />
            <template v-if="!editingThread">
                <ContentVisibility :tags="thread.tags" direct>
                    <Markdown class="content" :content="thread.content" />
                    <aside v-if="thread.images[0]" class="thread-images row wrap g-2 mb-3">
                        <img v-for="image in thread.images" class="br-small border-subtle" :src="image.url">
                    </aside>
                    <aside v-if="thread.quote" class="br-medium border-subtle column g-2 mb-3 p-3">
                        <ContentVisibility :tags="thread.quote.tags" direct>
                            <ContentHeader :content="thread.quote" context="preview">
                                <template #actions>
                                    <Tag type="link" icon="fa-right-to-bracket" label="View" @click="navigateTo(`/thread/${extractId(thread.quote.id)}`)" />
                                </template>
                            </ContentHeader>
                            <Markdown compact class="content preview" :content="thread.quote.content" />
                        </ContentVisibility>
                    </aside>
                </ContentVisibility>
            </template>
            <ClientOnly>
                <template v-if="editingThread && thread.user.id === session.user.id">
                    <MarkdownEditor class="my-4" :rows="10" v-model="thread.content" />
                </template>
            </ClientOnly>
            <footer>
                <div v-if="!thread.deleted && !editingThread" class="f-1 row wrap g-1 mb-4">
                        <button class="f-1" :disabled="replyState.disabled" @click="toggleReplyBox">
                            <i aria-hidden="true" class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                            <span>Reply</span>
                        </button>
                        <button class="f-1" :disabled="quoteState.disabled" @click="quoteThread">
                            <i aria-hidden="true" class="fa-solid fa-quote-left"></i>
                            <span>Quote</span>
                        </button>
                        <button class="f-1" @click="copyLink">
                            <i aria-hidden="true" class="fa-solid fa-copy"></i>
                            <span>Share</span>
                        </button>
                        <ClientOnly>
                            <button v-if="session.isAuthenticated" title="Options" @click="toggleOptions">
                                <i aria-hidden="true" class="fa-solid fa-ellipsis"></i>
                            </button>
                            <OverlayTransition>
                                <ExtraOptions
                                    v-if="showOptions"
                                    :target="thread"
                                    @updated="refresh"
                                    @edit="toggleEditThread"
                                    @award="awardThread"
                                    @report="submitReport(thread.id)"
                                    @delete="deleteThread"
                                    @archive="archiveThread"
                                    @pin="pinThread"
                                    @close="showOptions = false"
                                />
                            </OverlayTransition>
                        </ClientOnly>
                    </div>
                    <p v-if="!showReplyBox && !editingThread && actionWarning" class="warning mb-4" role="status">{{ actionWarning }}</p>
                    <div v-if="editingThread" key="edit-actions" class="row wrap f-1 g-1 mb-4">
                        <ButtonSpinner class="success f-1" :loading="submitting" @click="updateThread">
                            <i class="fa-solid fa-folder-open"></i>
                            <span>Save</span>
                        </ButtonSpinner>
                        <!-- <button class="info f-1" @click="togglePreview">
                            <i v-if="!showPreview" class="fa-solid fa-eye"></i>
                            <i v-else class="fa-solid fa-eye-slash"></i>
                            <span>Preview</span>
                        </button> -->
                        <button class="danger" @click="toggleEditThread">
                            <i class="fa-solid fa-ban"></i>
                            <span>Cancel</span>
                        </button>
                    </div>
                    <CollapseTransition>
                        <ReplyComposer
                            v-if="showReplyBox && !thread.deleted && !editingThread"
                            show-content-tags
                            class="mb-4"
                            :rows="5"
                            autofocus
                            :submitting="submitting"
                            :submit-label="quoting ? 'Submit quote' : 'Reply'"
                            :submit-icon="quoting ? 'fa-quote-left' : 'fa-reply'"
                            :disabled="activeSubmissionState.disabled"
                            :warning="activeSubmissionState.warning"
                            v-model:tags="replyTags"
                            @submit="submitThread"
                            @cancel="cancelThreadReply"
                            v-model="replyText"
                        />
                    </CollapseTransition>
            </footer>
        </section>
        <section class="column g-2 mt-2">
            <ThreadChain v-for="reply in thread.replies" :key="reply.id" :threads="[reply, ...(reply.chain ?? [])]" @reply="refresh" />
        </section>
    </article>
    <article v-else class="content-width column p-4">
        <footer class="box text center p-4">
            There is nothing here.
        </footer>
    </article>
</template>

<style scoped lang="scss">
aside.thread-images {
    img {
        max-width: 100%;
        max-height: 20rem;
        object-fit: contain;
        background-color: $white-1;
    }
}
</style>