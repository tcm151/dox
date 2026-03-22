<script setup lang="ts">
import ThreadReply from './components/ThreadReply'
import type { Thread, User } from '~/types'

const route = useRoute()
const hints = useHints()
const session = getSession()

const id = route.params.id?.toString()
await useFetch(`/api/thread/${id}/visit`)
const { data: thread, refresh } = await useFetch<Thread>(`/api/thread/${id}`)

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
    await session.useApi<Thread>(`/api/thread/${id}/reply`, {
        user: session.user.id,
        content: replyText.value,
        quoting: quoting.value,
        votes: {
            positive: [session.user.id],
            misleading: [],
            negative: [],
        },
    })
    submitting.value = false

    replyText.value = ""
    showReplyBox.value = false
    refresh()
}

function copyLink() {
    const postLink = window.location.href
    navigator.clipboard.writeText(postLink)
    hints.addSuccess("Copied post URL")
}

</script>

<template>
    <article class="column p-4" v-if="thread">
        <!-- <header class="row mb-4">
            <button class="dark" @click="useRouter().back()">
                <i class="fa-solid fa-arrow-left"></i>
                Go Back
            </button>
        </header> -->
        <section v-if="thread.replyTo" class="mb-2">
            <ThreadReply :thread="thread.replyTo" />
        </section>
        <section class="main box column p-4">
            <header class="row-wrap g-1">
                <Votes :target="thread" />
                <div class="row-wrap f-1 g-1">
                    <UserTag class="f-1" :user="(thread.user as User)" />
                    <Tag class="f-1" type="info" icon="fa-chart-simple" :label="thread.visits.toString()" />
                    <Tag class="f-1" type="info" icon="fa-message" :label="thread.replies.length.toString()" />
                    <DurationTag class="f-1" :time="thread.time" />
                    <Tag v-if="thread.timeEdited" class="f-1" type="danger" icon="fa-eraser" :label="formatDate(thread.timeEdited)" />
                </div>
                <TopicTag class="f-10" v-for="topic in thread.topics" :topic="topic" />
            </header>
            <Markdown class="content" :content="thread.content" />
            <footer>
                <div class="fill row-wrap g-1" v-if="!showReplyBox">
                    <button class="fill" @click="showReplyBox = true">
                        <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                        <span>Reply</span>
                    </button>
                    <button class="fill" @click="quoteThread()">
                        <i class="fa-solid fa-quote-left"></i>
                        <span>Quote</span>
                    </button>
                    <button class="fill" @click="copyLink">
                        <i class="fa-solid fa-copy"></i>
                        <span>Share</span>
                    </button>
                    <button class="fill" @click="submitReport(thread.id)">
                        <i class="fa-solid fa-flag"></i>
                        <span>Report</span>
                    </button>
                    <button>
                        <i class="fa-solid fa-ellipsis"></i>
                    </button>
                </div>
                <div class="field" v-else-if="showReplyBox">
                    <textarea rows="5" v-model="replyText"></textarea>
                    <div class="row g-2 mt-2">
                        <ButtonSpinner class="success fill" :loading="submitting" @click="submitThread">
                            <i class="fa-solid fa-message"></i>
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
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

section.reply-to:hover {
    @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}
</style>