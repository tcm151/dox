<script setup lang="ts">
import ThreadReply from './components/ThreadReply'
import type { Thread, User } from '~/types'

const route = useRoute()
const hints = useHints()
const session = getSession()

const id = route.params.id?.toString()
await useFetch(`/api/thread/${id}/visit`)
const { data: thread, refresh } = await useFetch<Thread>(`/api/thread/${id}`)

const [showReplyBox, toggleReply] = useToggle(false)
const reply = ref<string>("")

const submitting = ref<boolean>(false)
async function submitReply() {
    if (!session.isAuthenticated) {
        hints.addError("You must be logged in to interact with others.")
        return
    }
    
    submitting.value = true
    await session.useApi<Thread>(`/api/thread/${id}/reply`, {
        user: session.user.id,
        content: reply.value,
        votes: {
            positive: [session.user.id],
            misleading: [],
            negative: [],
        },
    })
    submitting.value = false

    reply.value = ""
    toggleReply()
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
        <section v-if="thread.replyTo" class="mb-2">
            <ThreadReply :thread="thread.replyTo" />
        </section>
        <section class="main box column p-4">
            <header class="row-wrap g-1">
                <Votes :target="thread" />
                <div class="row-wrap f-1 g-1">
                    <Tag class="f-1" type="info" icon="fa-chart-simple" :label="thread.visits.toString()" />
                    <Tag class="f-1" type="info" icon="fa-message" :label="thread.replies.length.toString()" />
                    <UserTag class="f-1" :user="(thread.user as User)" />
                    <DurationTag class="f-1" :time="thread.time" />
                    <Tag v-if="thread.timeEdited" class="f-1" type="danger" icon="fa-eraser" :label="formatDate(thread.timeEdited)" />
                </div>
                <TopicTag class="f-10" v-for="topic in thread.topics" :topic="topic" />
            </header>
            <Markdown class="content" :content="thread.content" />
            <ClientOnly>
                <footer>
                    <div class="fill row-wrap g-1" v-if="!showReplyBox">
                        <button class="fill" @click="toggleReply()">
                            <i class="fa-solid fa-reply-all"></i>
                            <span>Reply</span>
                        </button>
                        <button class="fill">
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
                        <textarea rows="5" v-model="reply"></textarea>
                        <div class="row g-2 mt-2">
                            <ButtonSpinner class="success fill" :loading="submitting" @click="submitReply">
                                <i class="fa-solid fa-message"></i>
                                <span>Submit</span>
                            </ButtonSpinner>
                            <button class="danger" @click="toggleReply()">
                                <i class="fa-solid fa-ban"></i>
                                <span>Cancel</span>
                            </button>
                        </div>
                    </div>
                </footer>
            </ClientOnly>
        </section>
        <section class="column g-2 mt-2">
            <template v-for="reply in thread.replies">
                <ThreadReply :thread="reply" />
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