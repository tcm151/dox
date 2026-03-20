<script setup lang="ts">
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

</script>

<template>
    <article class="column p-4" v-if="thread">
        <section class="main box column p-4" @click="navigateTo(`/thread/${extractId(thread.id)}`)">
            <header class="row-wrap g-1">
                <Votes :target="thread" />
                <TopicTag class="f-10" v-for="topic in thread.topics" :topic="topic" />
                <div class="row-wrap f-1 g-1">
                    <UserTag :user="(thread.user as User)" />
                    <!-- <Tag class="f-1" type="info" icon="fa-message" :label="thread.comments.length.toString()" /> -->
                    <DurationTag :time="thread.time" />
                    <Tag type="info" icon="fa-chart-simple" :label="thread.visits.toString()" />
                    <Tag v-if="thread.timeEdited" type="danger" icon="fa-eraser" :label="formatDate(thread.timeEdited)" />
                    <Tag type="info" icon="fa-ellipsis" @click.stop="hints.addWarning('We are still working on this...')" />
                </div>
            </header>
            <Markdown class="content" :content="thread.content" />
            <ClientOnly>
                <footer>
                    <div class="fill row-wrap g-1" v-if="!showReplyBox">
                        <button class="fill" @click="toggleReply()">
                            <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                            <span>Reply</span>
                        </button>
                        <!-- <button class="fill">
                            <i class="fa-solid fa-quote-left"></i>
                            <span>Quote</span>
                        </button>
                        <button class="fill">
                            <i class="fa-solid fa-copy"></i>
                            <span>Share</span>
                        </button>
                        <button class="fill">
                            <i class="fa-solid fa-flag"></i>
                            <span>Report</span>
                        </button>
                        <button>
                            <i class="fa-solid fa-ellipsis"></i>
                        </button> -->
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
        <section>
            <template v-for="reply in thread.replies">
                <ThreadPreview :thread="reply" />
            </template>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>