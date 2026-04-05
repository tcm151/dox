<script setup lang="ts">
import ThreadReply from './components/ThreadReply.vue'
import ExtraOptions from './components/ExtraOptions.vue'
import type { Thread } from '@@/shared/types'

const route = useRoute()
const hints = useHints()
const events = useEvents()
const session = getSession()

const id = route.params.id?.toString()
await useDatasource(`/api/thread/${id}/visit`)

const { data: thread, refresh } = await useDatasource<Thread>(`/api/thread/${id}`)

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
        hints.addError("You can't edit something that doesn't exist.")
        return
    }
    try {
        submitting.value = true
        await useApi(`/api/thread/${id}/edit`, {
            body: {
                content: thread.value.content
            }
        })
        thread.value.edited = true
        toggleEditThread()
        await refresh()
    }
    catch (error: any) {
        hints.addError(error.message)
    }
    finally {
        submitting.value = false
    }
}

const showReplyBox = ref<boolean>(false)
const replyText = ref<string>("")

const quoting = ref<boolean>(false)
function quoteThread() {
    showReplyBox.value = true
    quoting.value = true
}

const submitting = ref<boolean>(false)
async function submitThread() {
    if (!session.isAuthenticated) {
        hints.addError("You must be logged in to interact with others.")
        return
    }
    
    submitting.value = true
    const action = (quoting.value) ? "quote" : "reply"
    await useApi<Thread>(`/api/thread/${id}/${action}`, {
        body: {
            user: session.user.id,
            content: replyText.value,
            votes: {
                positive: [session.user.id],
                misleading: [],
                negative: [],
            },
        }
    })
    submitting.value = false

    replyText.value = ""
    showReplyBox.value = false
    refresh()
}

function copyLink() {
    const postLink = window.location.href
    navigator.clipboard.writeText(postLink)
    hints.addSuccess("Copied thread URL")
}

function goBack() {
    const lastTab = useCache().get<string>("feed.lastTab", () => "home")
    return navigateTo(`/feed/${lastTab.value}`)
}

// function previous() {
//     router.back()
// }

async function deleteThread() {
    events.publish(Trigger.showPopup, {
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete your thread?',
        accept: async () => {
            await useApi(`/api/thread/${id}/delete`)
            hints.addSuccess("Successfully deleted thread.")
            return navigateTo("/feed")
        },
    })
}

async function awardThread() {
    if (thread.value?.user.id == session.user.id) {
        hints.addError("You can't award your own threads.")
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
            await useApi(`/api/thread/${id}/award`)
            hints.addSuccess("Successfully awarded thread.")
            await refresh()
        },
    })
}

async function archiveThread() {
    await useApi(`/api/thread/${id}/archive`)
    hints.addSuccess("This thread has been archived.")
    await refresh()
}

async function pinThread() {
    await useApi(`/api/thread/${id}/pin`)
    hints.addSuccess("This thread has been pinned.")
}

const showOptions = ref<boolean>(false)
function toggleOptions() {
    showOptions.value = !showOptions.value
}
</script>

<template>
    <article v-if="thread" class="column p-4">
        <section v-if="thread.replyTo" class="mb-2">
            <ThreadReply :thread="thread.replyTo" />
        </section>
        <section class="main box column px-4 pt-4">
            <header class="row wrap g-1">
                <Votes :target="thread" />
                <div class="row wrap f-1 g-1">
                    <UserTag class="f-1" :user="thread.user" />
                    <Tag class="f-1" type="info" icon="fa-chart-simple" :label="thread.visits.toString()" />
                    <Tag class="f-1" type="info" icon="fa-comment" :label="thread.replies.length.toString()" />
                    <Tag class="f-1" type="info">
                        <i class="fa-solid fa-stopwatch"></i>
                        {{ formatDate(thread.time) }}
                        <template v-if="thread.edited">
                            <i class="fa-solid fa-eraser"></i>
                            {{ formatDate(thread.timeEdited) }}
                        </template>
                    </Tag>
                </div>
                <TopicTag v-for="topic in thread.topics" :topic="topic" />
            </header>
            <template v-if="!editingThread">
                <Markdown class="content" :content="thread.content" />
                <aside v-if="thread.quote" class="quote br-medium mb-3 px-3 pt-3">
                    <div class="row wrap g-1">
                        <Votes :target="thread.quote" />
                        <UserTag :user="thread.quote.user" />
                        <Tag type="info" icon="fa-chart-simple" :label="thread.quote.visits" />
                        <Tag type="info" icon="fa-comment" :label="thread.quote.replies.length.toString()" />
                        <DurationTag :time="thread.quote.time" />
                        <div v-if="thread.quote.topics.length > 0" class="row wrap g-1">
                            <TopicTag v-for="topic in thread.quote.topics" :topic="topic" />
                        </div>
                        <Tag type="link" icon="fa-right-to-bracket" label="View" @click="navigateTo(`/thread/${extractId(thread.quote.id)}`)" />
                    </div>
                    <Markdown class="content preview" :content="thread.quote.content" />
                </aside>
            </template>
            <ClientOnly>
                <div v-if="editingThread && thread.user.id === session.user.id" class="field my-4">
                    <textarea rows="10" v-model="thread.content" />
                </div>
            </ClientOnly>
            <footer>
                <div v-if="!thread.deleted && !editingThread && !showReplyBox" class="f-1 row wrap g-1 mb-4">
                    <button class="f-1" @click="showReplyBox = true">
                        <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                        <span>Reply</span>
                    </button>
                    <button class="f-1" @click="quoteThread()">
                        <i class="fa-solid fa-quote-left"></i>
                        <span>Quote</span>
                    </button>
                    <button class="f-1" @click="copyLink">
                        <i class="fa-solid fa-copy"></i>
                        <span>Share</span>
                    </button>
                    <ClientOnly>
                        <button v-if="session.isAuthenticated" @click="toggleOptions">
                            <i class="fa-solid fa-ellipsis"></i>
                        </button>
                        <ExtraOptions 
                            v-if="showOptions"
                            :thread="thread"
                            @edit="toggleEditThread"
                            @award="awardThread"
                            @report="submitReport(thread.id)"
                            @delete="deleteThread"
                            @archive="archiveThread"
                            @pin="pinThread"
                            @close="showOptions = false"
                        />
                    </ClientOnly>
                </div>
                <div v-else-if="editingThread" class="row wrap f-1 g-1 mb-4">
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
                <div class="field mb-4" v-else-if="showReplyBox">
                    <textarea rows="5" v-model="replyText"></textarea>
                    <div class="row g-2 mt-2">
                        <ButtonSpinner class="success f-1" :loading="submitting" @click="submitThread">
                            <i class="fa-solid fa-comment"></i>
                            <span>Submit</span>
                        </ButtonSpinner>
                        <button class="danger" @click="showReplyBox = false">
                            <i class="fa-solid fa-ban"></i>
                            <span>Cancel</span>
                        </button>
                    </div>
                </div>
            </footer>
        </section>
        <section class="column g-2 mt-2">
            <template v-for="reply in thread.replies">
                <ThreadReply :thread="reply" :chain="true" />
            </template>
        </section>
    </article>
    <article v-else class="column p-4">
        <footer class="box text center p-4">
            There is nothing here.
        </footer>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

section.reply-to:hover {
    @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}

aside.quote {
    border: 1px solid $white-2;
}
</style>