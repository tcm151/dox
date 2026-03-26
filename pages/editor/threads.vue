<script setup lang="ts">
import type { User, Thread } from '~/types'

const hints = useHints()
const cache = useCache()
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
    user: '' as User & string,
    content: '',
    time: '',
    topics: [],
    replies: [],
    images: [],
    votes: {
        positive: [],
        misleading: [],
        negative: [],
        awards: [],
        saves: [],
    },
    score: 0,
    visits: 0,
    edited: false,
    deleted: false,
    archived: false,
})

const submitting = ref<boolean>(false)
async function submit() {
    try {
        submitting.value = true
        const thread = await useApi<Thread>("/api/thread/add", {
            body: {
                user: session.user.id,
                content: newThread.value.content,
                topics: newThread.value.topics,
                votes: {
                    positive: [session.user.id],
                    misleading: [],
                    negative: [],
                },
            }
        })

        return navigateTo(`/thread/${extractId(thread.id)}`)
    }
    catch (error: any) {
        hints.addError("Failed to submit thread.")
    }
    finally {
        submitting.value = false
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

</script>

<template>
    <article class="editor column p-4">
        <header class="box column g-2 p-4">
            <div class="field">
                <label>Content</label>
                <textarea class="f-1" type="text" rows="4" v-model="newThread.content" />
            </div>
            <TopicField v-model:input="newTopic" :topics="newThread.topics" @add="addTopic" @remove="removeTopic" />
            <div class="row g-2 mt-2">
                <ButtonSpinner class="success f-1 b-0" :loading="submitting" @click="submit">
                    <i class="fa-solid fa-share"></i>
                    <span>Submit</span>
                </ButtonSpinner>
                <button class="link f-1 b-0" @click="selectImages">
                    <i class="fa-solid fa-images"></i>
                    <span>Upload</span>
                </button>
                <button class="info f-1 b-0" @click="togglePreview">
                    <i v-if="!showPreview" class="fa-solid fa-eye"></i>
                    <i v-else class="fa-solid fa-eye-slash"></i>
                    <span>Preview</span>
                </button>
                <button class="danger f-1 b-0" @click="toggleEditor">
                    <i class="fa-solid fa-ban"></i>
                    <span>Cancel</span>
                </button>
            </div>
        </header>
    </article>
</template>

<style scoped lang="scss">
article.editor {
    @include fit-width (60rem, 1rem);
}
</style>