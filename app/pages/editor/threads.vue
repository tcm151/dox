<script setup lang="ts">
import type { User, Thread } from '@@/shared/types'

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
// TODO render actual preview content when showPreview is true; current toggle only changes button/icon state.
function togglePreview() {
    showPreview.value = !showPreview.value
    hints.addWarning('We are still working on this...')
}

// TODO complete thread editor parity with post editor: drafts, image upload, markdown preview, and cancel/discard flow.
// TODO allow for direct mentions of users in the content with autocomplete and validation, similar to topic tagging in the post editor.
</script>

<template>
    <article class="column m-4">
        <section class="box column p-5">
            <header class="row inline between mb-4">
                <h1>New Thread</h1>
                <!-- FIXME drafts button has empty click handler; wire to drafts flow or hide until implemented. -->
                <button @click="">
                    <i class="fa-solid fa-compass-drafting"></i>
                    <span>Drafts</span>
                </button>
            </header>
            <section class="form f-1 column g-2">
                <div class="field">
                    <label>Content</label>
                    <textarea class="f-1" rows="8" v-model="newThread.content" />
                </div>
                <TopicField v-model:text="newTopic" :topics="newThread.topics" @add="addTopic" @remove="removeTopic" />
            </section>
            <footer class="row g-2 mt-5">
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
                <!-- FIXME cancel button has empty click handler; implement clear/navigate/discard-confirm behavior. -->
                <button class="danger f-1 b-0" @click="">
                    <i class="fa-solid fa-ban"></i>
                    <span>Cancel</span>
                </button>
            </footer>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width (60rem, 1rem);
}
</style>