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
    }
    catch (ex: any) {
        hints.addError("Failed to submit thread.")
    }
}

function selectImages() {

}

const showPreview = ref<boolean>(false)
function togglePreview() {
    showPreview.value = !showPreview.value
}

const { data: threads, pending, refresh } = await useAsyncData<Thread[]>('threads', () => {
    return $fetch("/api/thread")
})
</script>

<template>
    <article class="column g-4 p-4">
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
                <button class="danger fill" @click="">
                    <i class="fa-solid fa-ban"></i>
                    <span>Cancel</span>
                </button>
            </div>
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
</style>