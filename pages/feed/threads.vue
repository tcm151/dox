<script setup lang="ts">
import type { Thread } from '~/types';

const hints = useHints()
const session = getSession()

const newTopic = ref<string>("")

function addTopic(topic: string) {
    newThread.value.topics.push(`topic:${topic}`)
    newTopic.value = ""
}

function removeTopic(topic: string) {
    newThread.value.topics = newThread.value.topics.filter(t => t !== topic)
}

let newThread = ref<Thread>({
    id: '',
    user: '',
    content: '',
    time: '',
    topics: [],
    images: [],
    votes: {
        positive: [],
        misleading: [],
        negative: [],
        score: 0,
    },
    visits: 0,
})
async function submit() {
    try {
        const thread = await session.useApi<Thread>("/api/thread/add", {
            user: session.user.id,
            content: newThread.value.content,
            topics: newThread.value.topics,
            votes: {
                positive: [session.user.id],
                misleading: [],
                negative: [],
            },
        })

        hints.addSuccess(`Submitted new ${thread?.id}`)
        await refresh()
        clearEditor()
    }
    catch (ex: any) {
        hints.addError("Failed to submit thread.")
    }
}

function clearEditor() {
    newThread.value = {
            id: '',
            user: '',
            content: '',
            time: '',
            topics: [],
            images: [],
            votes: {
                positive: [],
                misleading: [],
                negative: [],
                score: 0,
            },
            visits: 0,
        }
}

function selectImages() {
    hints.addWarning('We are still working on this...')
}

const showPreview = ref<boolean>(false)
function togglePreview() {
    showPreview.value = !showPreview.value
    hints.addWarning('We are still working on this...')
}

const { data: threads, pending, refresh } = await useAsyncData('threads', () => {
    return $fetch<Thread[]>("/api/thread")
})
</script>

<template>
    <article class="column g-2 p-4">
        <header class="box column g-2 p-4">
            <div class="field">
                <label>Content</label>
                <textarea class="fill" type="text" rows="4" v-model="newThread.content" />
            </div>
            <TopicField v-model:input="newTopic" :topics="newThread.topics" @add="addTopic" @remove="removeTopic" />
            <div class="row g-2 mt-2">
                <button class="success fill" @click="submit">
                    <i class="fa-solid fa-share"></i>
                    <span>Submit</span>
                </button>
                <button class="link fill" @click="selectImages">
                    <i class="fa-solid fa-images"></i>
                    <span>Upload</span>
                </button>
                <button class="info fill" @click="togglePreview">
                    <i class="fa-solid fa-eye" v-if="!showPreview"></i>
                    <i class="fa-solid fa-eye-slash" v-else></i>
                    <span>Preview</span>
                </button>
                <button class="danger fill" @click="clearEditor">
                    <i class="fa-solid fa-ban"></i>
                    <span>Cancel</span>
                </button>
            </div>
        </header>
        <header class="sorting row center g-2">
            <button class="refresh dark" @click="refresh()">
                <i class="fa-solid fa-rotate" :class="{ spin: pending }"></i>
            </button>
            <button class="dark" @click="hints.addWarning('We are still working on this...')">
                <i class="fa-solid fa-globe"></i>
                <span>{{ "All" }}</span>
            </button>
            <button @click="hints.addWarning('We are still working on this...')" :class="{ selected: false }">
                <i class="fa-solid fa-egg"></i>
                <span>New</span>
            </button>
            <button @click="hints.addWarning('We are still working on this...')" :class="{ selected: false }">
                <i class="fa-solid fa-fire"></i>
                <span>Hot</span>
            </button>
            <button @click="hints.addWarning('We are still working on this...')" :class="{ selected: false }">
                <i class="fa-solid fa-ranking-star"></i>
                <span>Top</span>
            </button>
        </header>
        <section class="column g-2">
            <ThreadPreview :thread="thread" v-for="thread in threads" :key="thread.id" />
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}

header.box {
    // border: 2px solid $dox-white-2;
    outline: 2px solid $dox-white-2;
}

header.sorting {
    button:not(.refresh) {
        flex: 1 1;
    }
}
</style>