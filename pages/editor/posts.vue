<script setup lang="ts">
import Drafts from "./components/Drafts.client.vue"
import type { User, Post, Draft, Image } from '~/types'

definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (ENV.isClient()) {
            const session = getSession()
            if (to.path.startsWith("/editor") && !session.isAuthenticated) {
                return abortNavigation()
            }
        }
    }
})

const hints = useHints()
const session = getSession()
const valid = useValidation()

let draft = ref<Draft>({
    id: '',
    time: '',
    user: session.user as User & string,
    title: '',
    content: '',
    topics: [],
    images: [],
})

const route = useRoute()
const replyTo = computedAsync<Post | undefined>(async () => {
    if (route.query['replyTo'] || draft.value.replyTo) {
        const post = await useApi<Post>(`/api/post/${route.query['replyTo'] ?? extractId(draft.value.replyTo as string)}`)
        draft.value.replyTo = post.id as Post & string
        return post
    }
})

let newTopic = ref("")
let titleFocused = ref(false)

function validTitle() {
    return (draft.value.title == '') ? true : valid.title.test(draft.value.title)
}

function validTopic() {
    return (newTopic.value == '') ? true : valid.topic.test(newTopic.value)
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

const confirmUpload = ref(false)
let uploadedImages = useSessionStorage<Image[]>('uploadedImages', [])

const { files, open: openFileDialog, reset } = useFileDialog({
    accept: "image/*"
})

whenever(files, () => {
    confirmUpload.value = true
})

function selectImages() {
    if (!hasTrait(session.user, "confirmed")) {
        hints.addWarning("You must confirm your account before uploading images.")
        return
    }
    openFileDialog()
}

let uploading = ref<boolean>(false)


async function beginUpload() {
    if (!files.value) {
        hints.addWarning("Please select an image.")
        return
    }
    confirmUpload.value = false
    uploading.value = true
    const image = await uploadMedia<Image>(files.value, "image")
    if (image != null) {
        uploadedImages.value.push(image)
    }
    uploading.value = false
    reset()
}

function cancelUpload() {
    confirmUpload.value = false
    reset()
}

async function deleteImage(image: Image) {
    await useApi(`/api/image/${extractId(image.id)}/delete`)
    uploadedImages.value = uploadedImages.value.filter(i => i !== image)
    hints.addSuccess(`You have been refunded ${image.tokens} tokens.`)
}

function copyImageUrl(event: Event) {
    let imageUrl = (event.target as HTMLImageElement).currentSrc
    navigator.clipboard.writeText(`![](${imageUrl})`)
    hints.addSuccess("Copied image in markdown syntax.")
}

const submitting = ref<boolean>(false)
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
        submitting.value = true
        const post = await useApi<Post>("/api/post/add", {
            body: {
                user: session.user!.id,
                title: draft.value.title,
                content: draft.value.content,
                time: new Date(),
                replyTo: draft.value.replyTo,
                votes: {
                    positive: [session.user!.id],
                    misleading: [],
                    negative: [],
                },
                topics: draft.value.topics,
                comments: [],
                images: uploadedImages.value.map(i => i.id)
            }
        })
        
        uploadedImages.value = []
        navigateTo(`/post/${extractId(post.id)}`)
    }
    catch (error: any) {
        hints.addError("Failed to submit post.")
    }
    finally {
        submitting.value = false
    }
}

async function saveDraft() {
    
    if (!validTitle()) {
        hints.addError("Title is invalid.")
        return
    }

    if (draft.value.id !== '') {
        await useApi<Draft>(`/api/profile/drafts/${extractId(draft.value.id)}/update`, {
            body: {
                title: draft.value.title,
                content: draft.value.content,
                replyTo: draft.value.replyTo,
                topics: draft.value.topics,
                images: uploadedImages.value.map(i => i.id)
            }
        })
        hints.addSuccess("Draft updated.")
    }
    else {
        const response = await useApi<Draft>("/api/profile/drafts/add", {
            body: {
                user: session.user!.id,
                title: draft.value.title,
                content: draft.value.content,
                time: new Date(),
                replyTo: draft.value.replyTo,
                topics: draft.value.topics,
                images: uploadedImages.value.map(i => i.id)
            }
        })
        draft.value.id = response.id
        hints.addSuccess("Draft saved.")
    }
}
</script>

<template>
    <article class="editor column p-4 fit-large">
        <div class="container box dark br-medium column f-1">
            <Drafts :visible="showDrafts" @view="viewDraft" @close="showDrafts = false" />
            <MediaUploader :visible="confirmUpload" :media="files" @accept="beginUpload" @close="cancelUpload" />
            <div class="reply-to row inline g-2" v-if="replyTo">
                <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                <p class="text-truncate">{{ replyTo?.title }}</p>
            </div>
            <section class="editor box br-medium column p-5">
                <div class="column f-1" v-show="!showPreview">
                    <header class="row inline between mb-4">
                        <h1>New Post</h1>
                        <button @click="showDrafts = true">
                            <i class="fa-solid fa-compass-drafting"></i>
                            <span>Drafts</span>
                        </button>
                    </header>
                    <form class="form f-1 column g-2">
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
                        <div class="field f-1">
                            <label>Content</label>
                            <textarea class="f-1" v-model="draft.content" type="text" rows="12" />
                        </div>
                        <TopicField v-model:input="newTopic" :topics="draft.topics" @add="addTopic" @remove="removeTopic" />
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
                <div class="preview box br-medium f-1" v-show="showPreview">
                    <h1 class="mb-2">{{ draft.title }}</h1>
                    <Markdown class="content" :content="draft.content" />
                    <span class="watermark" v-if="draft.title === '' && draft.content === ''">Preview</span>
                </div>
                <section class="row wrap g-2 mt-5">
                    <ButtonSpinner class="success f-1 b-0" :loading="submitting" @click="submit">
                        <i class="fa-solid fa-share"></i>
                        <span>Submit</span>
                    </ButtonSpinner>
                    <button class="link f-1 b-0" @click="saveDraft" v-if="draft.id != ''">
                        <i class="fa-solid fa-folder-open"></i>
                        <span>Update</span>
                    </button>
                    <button class="link f-1 b-0" @click="saveDraft" v-else>
                        <i class="fa-solid fa-folder-open"></i>
                        <span>Save</span>
                    </button>
                    <button class="link f-1 b-0" @click="selectImages">
                        <i class="fa-solid fa-images"></i>
                        <span>Upload</span>
                    </button>
                    <button class="info f-1 b-0" @click="togglePreview">
                        <i class="fa-solid fa-eye" v-if="!showPreview"></i>
                        <i class="fa-solid fa-eye-slash" v-else></i>
                        <span>Preview</span>
                    </button>
                    <!-- <button class="danger f-1" @click="navigateTo('/')">Cancel</button> -->
                </section>
            </section>
        </div>
    </article>
</template>

<style scoped lang="scss">
article.editor {
    justify-content: center;
    overflow-y: hidden;
}

section.editor, section.preview {
    flex: 1 1 400px;
    min-width: 250px;
    overflow-y: hidden;
}

div.reply-to {
    padding: 0.5rem 0.75rem;
    color: $white-0;
    
    p {
        font-weight: 700;
    }
}

section.editor {
    .topic-input {

        .row {
            width: min-content;
        }
        
        label {
            vertical-align: middle;
            line-height: 1.5rem;
        }
    }

    textarea {
        resize: none !important;
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
        background-color: $white-1;
    }

    img:hover {
        cursor: pointer;
        border: 1px solid $blue;
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
        font-size: 5rem;
        font-weight: 900;
        opacity: 0.05;
        color: $purple;
        text-align: center;
        text-transform: uppercase;
        transform: translate(-50%, -50%);
    }
}

input[type=file] {
    display: none;
}
</style>