<script setup lang="ts">
import { DateTime } from 'luxon'
import { Post, Draft } from '~/types'

definePageMeta({
    layout: 'simple'
})

const hints = useHints()
const session = getSession()
const settings = useUserSettings()


let draft = ref<Draft>({
    id: '',
    time: '',
    user: session.user,
    title: '',
    content: '',
    topics: [],
})

let newTopic = ref("")
let titleFocused = ref(false)
let topicsFocused = ref(false)


function validTitle() {
    return draft.value.title !== '' ? /.{4,128}/.test(draft.value.title) : true
}

function validTopic() {
    return newTopic.value !== '' ? /^\b[A-Za-z]{3,24}\b$/.test(newTopic.value) : true
}

function addTopic() {
    if (validTopic()) {
        draft.value.topics.push(`topic:${newTopic.value}`)
        newTopic.value = ""
        return
    }
    hints.addWarning("Topic is not valid")
}

function removeTopic(topic: string) {
    draft.value.topics = draft.value.topics.filter(t => t !== topic)
}


let showDrafts = ref(false)
function viewDraft(existingDraft: Draft) {
    draft.value = existingDraft
    showDrafts.value = false
}

let showPreview = ref(settings.state.showPreviewByDefault ?? false)
function togglePreview() {
    showPreview.value = !showPreview.value
}

async function submit() {
    
    if (!validTitle()) {
        hints.addError("Title is invalid")
        return
    }

    if (draft.value.topics.length == 0) {
        hints.addError("You must include at least one topic.")
        return
    }
    
    try {
        const post = await session.useApi<Post>("/api/post/add", {
            user: session.user!.id,
            title: draft.value.title,
            content: draft.value.content,
            votes: {
                positive: [session.user!.id],
                misleading: [],
                negative: [],
            },
            time: DateTime.now(),
            topics: draft.value.topics,
            comments: [],
        })
        
        navigateTo(`/post/${extractId(post?.id)}`)
    }
    catch (ex: any) {
        hints.addError(ex.message)
        console.log(ex)
    }
}

async function saveDraft() {
    
    if (!validTitle()) {
        hints.addError("Title is invalid")
        return
    }

    if (draft.value.id !== '') {
        await session.useApi<Draft>(`/api/profile/drafts/${extractId(draft.value.id)}/update`, {
            title: draft.value.title,
            content: draft.value.content,
            topics: draft.value.topics,
        })
        hints.addSuccess("Draft updated")
    }
    else {
        const response = await session.useApi<Draft>("/api/profile/drafts/add", {
            user: session.user!.id,
            title: draft.value.title,
            content: draft.value.content,
            time: new Date(),
            topics: draft.value.topics,
        })
        draft.value.id = response!.id
        hints.addSuccess("Draft saved")
    }
}
</script>

<template>
    <ClientOnly>
        <article id="editor" class="row-wrap g-4 p-4">
            <Drafts :visible="showDrafts" @view="viewDraft" @close="showDrafts = false" />
            <section class="editor column p-5">
                <header id="header" class="row center-inline mb-4">
                    <h1>New Post</h1>
                    <button @click="showDrafts = true">
                        <i class="fa-solid fa-compass-drafting"></i>
                        <span class="ml-2">Drafts</span>
                    </button>
                </header>
                <form class="form fill column">
                    <div class="field">
                        <label>Title</label>
                        <input
                            type="text"
                            v-model="draft.title"
                            @focus="titleFocused = true"
                            @blur="titleFocused = false"
                            :class="{ 'invalid': titleFocused && !validTitle() }"
                        />
                    </div>
                    <div class="field fill">
                        <label>Content</label>
                        <textarea class="fill" v-model="draft.content" type="text" rows="12" />
                    </div>
                    <div class="field topic-input">
                        <div class="row center-inline g-2 mb-2">
                            <label class="mb-0">Topics</label>
                            <span class="tag topic" v-for="topic in draft.topics" @contextmenu.prevent="removeTopic(topic)">
                                {{ topic.split(':')[1] }}
                            </span>
                        </div>
                        <input
                            type="text"
                            v-model="newTopic"
                            spellcheck="false"
                            @keyup.enter="addTopic"
                            @focus="topicsFocused = true"
                            @blur="topicsFocused = false"
                            :class="{ 'invalid': topicsFocused && !validTopic() }"
                        />
                    </div>
                </form>
                <section class="row-wrap g-2 mt-5">
                    <button class="success fill" @click="submit">
                        <i class="fa-solid fa-share"></i>
                        <span>Submit</span>
                    </button>
                    <button class="link fill" @click="saveDraft" v-if="draft.id != ''">
                        <i class="fa-solid fa-folder-open"></i>
                        <span>Update</span>
                    </button>
                    <button class="link fill" @click="saveDraft" v-else>
                        <i class="fa-solid fa-folder-open"></i>
                        <span>Save</span>
                    </button>
                    <button class="info fill" @click="togglePreview">
                        <i class="fa-solid fa-eye" v-if="!showPreview"></i>
                        <i class="fa-solid fa-eye-slash" v-else></i>
                        <span>Preview</span>
                    </button>
                    <button class="danger fill" @click="navigateTo('/')">Cancel</button>
                </section>
            </section>
            <section class="preview p-5" v-if="showPreview">
                <h1 class="mb-2">{{ draft.title }}</h1>
                <div class="content" v-html="renderMarkdown(draft.content)">
                </div>
                <span class="watermark" v-if="draft.title === '' && draft.content === ''">Preview</span>
            </section>
        </article>
    </ClientOnly>
</template>

<style lang="scss">
code {
    font-size: 0.95rem;
    font-weight: 500;
    font-family: 'Source Code Pro', monospace;
    border-radius: 0.25rem;
    background-color: $dox-white-light !important;
}
</style>

<style scoped lang="scss">
article#editor {
    flex: 1 1;
    justify-content: center;
    align-items: flex-start;
    @include fit-width (1200px, 1rem);
    overflow-y: hidden;
}

#header {
    justify-content: space-between;
}

.topic-input {
    label {
        vertical-align: middle;
        line-height: 1.5rem;
    }
}

.editor, .preview {
    height: calc(100% - 3rem);
    overflow-y: auto;

    flex: 1 1 400px;
    min-width: 250px;
    max-width: 800px;
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
}

.preview {
    // overflow-y: hidden;
    position: relative;
    min-height: 100px;

    // div.content {
    //     overflow-y: auto;
    // }

    .watermark {
        top: 50%;
        left: 50%;
        position: absolute;
        font-size: 4.5rem;
        font-weight: 900;
        opacity: 0.05;
        color: $dox-purple;
        text-align: center;
        text-transform: uppercase;
        transform: translate(-50%, -50%);
    }
}

.preview-enter-active, .preview-leave-active {
    transition: all 256ms ease;
}

.preview-enter-from, .preview-leave-to {
    opacity: 0;
}

textarea {
    resize: none !important;
}

.content {
    h1, h2, h3, h4 {
        margin-bottom: 0.2rem !important;
    }
}

.invalid {
    background-color: $dox-red-light !important;
}
</style>