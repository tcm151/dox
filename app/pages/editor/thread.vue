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
function togglePreview() {
    showPreview.value = !showPreview.value
}

</script>

<template>
    <article class="column p-4">
        <section class="box column p-5">
            <section class="editor column" v-show="!showPreview">
                <header class="row inline between mb-4">
                    <h1>New Thread</h1>
                    <button @click="">
                        <i class="fa-solid fa-compass-drafting"></i>
                        <span>Drafts</span>
                    </button>
                </header>
                <section class="form f-1 column g-2">
                    <MarkdownEditor bounded label="Content" :rows="8" v-model="newThread.content" />
                    <TopicField v-model:text="newTopic" :topics="newThread.topics" @add="addTopic" @remove="removeTopic" />
                </section>
            </section>
            <section class="preview f-1" v-show="showPreview">
                <h1>New Thread</h1>
                <Markdown class="content" :content="newThread.content" />
                <span v-if="newThread.content === ''" class="watermark">Preview</span>
            </section>
            <footer class="row wrap g-2 mt-5">
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
            </footer>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width (60rem, 1rem);
    flex: 1 1 auto;
    min-height: 0;
    box-sizing: border-box;
}

article > section.box,
section.editor,
section.form {
    flex: 1 1 auto;
    min-height: 0;
}

article > section.box {
    overflow: hidden;
}

section.editor > header,
footer.row {
    flex: 0 0 auto;
}

section.preview {
    position: relative;
    min-height: 0;
    white-space: normal;
    overflow-y: auto;

    div.content {
        white-space: normal;
    }

    .watermark {
        top: 50%;
        left: 50%;
        position: absolute;
        font-size: 5rem;
        font-weight: 900;
        opacity: 0.05;
        color: $purple;
        text-align: center;
        text-transform: uppercase;
        transform: translate(-50%, -50%);
    }
}
</style>