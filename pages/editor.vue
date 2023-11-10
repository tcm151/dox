<script setup lang="ts">
import { DateTime } from 'luxon'
import type { Post, Draft, Image } from '~/types'

definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (process.client) {
            const session = getSession()
            if (to.path.startsWith("/editor") && !session.isAuthenticated) {
                return abortNavigation()
            }
        }
    }
})

const hints = useHints()
const valid = useValidation()
const session = getSession()

let draft = ref<Draft>({
    id: '',
    time: '',
    user: session.user,
    title: '',
    content: '',
    topics: [],
    images: [],
})

const route = useRoute()
const replyTo = computedAsync<Post | null>(async () => {
    if (route.query['replyTo'] || draft.value.replyTo) {
        const post = await $fetch(`/api/post/${route.query['replyTo'] ?? extractId(draft.value.replyTo as string)}`)
        draft.value.replyTo = post.id
        return post
    }
    return null
})

let newTopic = ref("")
let titleFocused = ref(false)
let topicsFocused = ref(false)


function validTitle() {
    return draft.value.title !== '' ? valid.title.test(draft.value.title) : true
}

function validTopic() {
    return newTopic.value !== '' ? valid.topic.test(newTopic.value) : true
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

let showPreview = ref(false)
function togglePreview() {
    showPreview.value = !showPreview.value
}

const confirmImageUpload = ref(false)
let uploadedImages = useSessionStorage<Image[]>('uploadedImages', [])

const { files, open: openFileDialog, reset } = useFileDialog({
    accept: "image/*"
})

function selectImages() {
    if (session.user.confirmed) {
        openFileDialog()
    }
    else {
        hints.addWarning("You must confirm your account before uploading images.")
    }
}

let uploading = ref<boolean>(false)
watch(files, async () => {
    if (files.value) {
        confirmImageUpload.value = true
    }
})

async function beginUpload() {
    confirmImageUpload.value = false
    uploading.value = true
    const image = await uploadImage(files.value)
    if (image != null) {
        uploadedImages.value.push(image)
    }
    uploading.value = false
    reset()
}

function cancelUpload() {
    confirmImageUpload.value = false
    reset()
}

async function deleteImage(image: Image) {
    try {
        await session.useApi(`/api/image/${extractId(image.id)}/delete`)
        uploadedImages.value = uploadedImages.value.filter(i => i !== image)
        hints.addSuccess(`You have been refunded ${image.tokens} tokens.`)
    }
    catch (ex: any) {
        hints.addError(`Failed to delete image. Please try again.`)
    }
}

function copyImageUrl(event: Event) {
    let imageUrl = (event.target as HTMLImageElement).currentSrc
    navigator.clipboard.writeText(`![](${imageUrl})`);
    hints.addSuccess("Copied image in markdown syntax.");
}

async function submit() {
    
    if (!validTitle()) {
        hints.addError("Title is invalid.")
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
            time: DateTime.now(),
            replyTo: draft.value.replyTo,
            votes: {
                positive: [session.user!.id],
                misleading: [],
                negative: [],
            },
            topics: draft.value.topics,
            comments: [],
            images: uploadedImages.value.map(i => i.id)
        })
        
        uploadedImages.value = []
        navigateTo(`/post/${extractId(post?.id)}`)
    }
    catch (ex: any) {
        hints.addError(ex.message)
        console.log(ex)
    }
}

async function saveDraft() {
    
    if (!validTitle()) {
        hints.addError("Title is invalid.")
        return
    }

    if (draft.value.id !== '') {
        await session.useApi<Draft>(`/api/profile/drafts/${extractId(draft.value.id)}/update`, {
            title: draft.value.title,
            content: draft.value.content,
            replyTo: draft.value.replyTo,
            topics: draft.value.topics,
            images: uploadedImages.value.map(i => i.id)
        })
        hints.addSuccess("Draft updated.")
    }
    else {
        const response = await session.useApi<Draft>("/api/profile/drafts/add", {
            user: session.user!.id,
            title: draft.value.title,
            content: draft.value.content,
            time: new Date(),
            replyTo: draft.value.replyTo,
            topics: draft.value.topics,
            images: uploadedImages.value.map(i => i.id)
        })
        draft.value.id = response!.id
        hints.addSuccess("Draft saved.")
    }
}
</script>

<template>
    <article class="editor column p-4">
        <div class="container column fill">
            <Drafts :visible="showDrafts" @view="viewDraft" @close="showDrafts = false" />
            <ImageUploader :visible="confirmImageUpload" :images="files" @accept="beginUpload" @close="cancelUpload" />
            <div class="reply-to row center-inline g-2" v-if="replyTo">
                <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                <p>{{ replyTo?.title }}</p>
            </div>
            <section class="editor column p-5">
                <div class="column fill" v-if="!showPreview">
                    <header class="row center-inline mb-4">
                        <h1>New Post</h1>
                        <button @click="showDrafts = true">
                            <i class="fa-solid fa-compass-drafting"></i>
                            <span>Drafts</span>
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
                                <TopicTag v-for="topic in draft.topics" :topic="topic" @contextmenu.prevent="removeTopic(topic)" />
                            </div>
                            <input
                                type="text"
                                v-model="newTopic"
                                spellcheck="false"
                                placeholder="press enter to add . . ."
                                @keyup.enter="addTopic"
                                @focus="topicsFocused = true"
                                @blur="topicsFocused = false"
                                :class="{ 'invalid': topicsFocused && !validTopic() }"
                            />
                        </div>
                        <div class="field uploaded-images" v-if="uploadedImages.length > 0">
                            <label>Images</label>
                            <div class="row g-2">
                                <img
                                    v-for="image in uploadedImages"
                                    @click="copyImageUrl"
                                    @contextmenu.prevent="deleteImage(image)"
                                    :src="image.url"
                                >
                            </div>
                        </div>
                    </form>
                </div>
                <div class="preview fill" v-else>
                    <h1 class="mb-2">{{ draft.title }}</h1>
                    <Markdown class="content" :content="draft.content" />
                    <span class="watermark" v-if="draft.title === '' && draft.content === ''">Preview</span>
                </div>
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
                    <button class="link fill" @click="selectImages">
                        <i class="fa-solid fa-images"></i>
                        <span>Upload</span>
                    </button>
                    <button class="info fill" @click="togglePreview">
                        <i class="fa-solid fa-eye" v-if="!showPreview"></i>
                        <i class="fa-solid fa-eye-slash" v-else></i>
                        <span>Preview</span>
                    </button>
                    <!-- <button class="danger fill" @click="navigateTo('/')">Cancel</button> -->
                </section>
            </section>
        </div>
    </article>
</template>

<style scoped lang="scss">
article.editor {
    @include fit-width (800px, 1rem);
    justify-content: center;
    overflow-y: hidden;

    div.container {
        border-radius: 0.5rem 0.5rem;
        background-color: $dox-white-3;
    }
}

section.editor, section.preview {
    flex: 1 1 400px;
    min-width: 250px;
    border-radius: 0.5rem;
    background-color: $dox-white-0;
}

.reply-to {
    padding: 0.5rem 0.75rem;
    font-weight: 700;
    color: $dox-white-0;

    p {
        overflow-x: hidden;
        text-overflow: ellipsis;
    }
}

section.editor {
    header {
        justify-content: space-between;
    }

    .topic-input {
        label {
            vertical-align: middle;
            line-height: 1.5rem;
        }
    }

    textarea {
        resize: none !important;
    }

    input.invalid {
        outline: 1px solid $dox-red !important;
    }
}


div.uploaded-images {
    div.row {
        overflow-x: auto;
    }

    img {
        height: 64px;
        max-width: calc(64px + 32px);
        object-fit: contain;
        border-radius: 0.25rem;
        border: 1px solid transparent;
        background-color: $dox-white-1;
    }

    img:hover {
        cursor: pointer;
        border: 1px solid $dox-blue;
    }
}

.preview {
    position: relative;
    min-height: 100px;
    white-space: normal;
    overflow-y: auto;

    div.content {
        white-space: normal;
        
        h1, h2, h3, h4 {
            margin-bottom: 0.2rem !important;
        }
    }

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

input[type=file] {
    display: none;
}
</style>