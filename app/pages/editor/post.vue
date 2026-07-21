<script setup lang="ts">
import Drafts from "./components/Drafts.client.vue"
import EditorFrame from "./components/EditorFrame.vue"
import UploadedImages from "./components/UploadedImages.vue"
import type { User, Post, Draft } from '@@/shared/types'

const hints = useHints()
const valid = useValidation()
const session = getSession()

const route = useRoute()
const replyTo = computedAsync<Post | undefined>(async () => {
    if (route.query['replyTo'] || draft.value.replyTo) {
        const post = await useApi<Post>(`/api/post/${route.query['replyTo'] ?? extractId(draft.value.replyTo as string)}`)
        draft.value.replyTo = post.id as Post & string
        useRouter().replace({ query: {} })
        return post
    }
})

let draft = ref<Draft>({
    id: '',
    time: '',
    user: session.user as User & string,
    title: '',
    content: '',
    topics: [],
    images: [],
})

let titleFocused = ref(false)
function validTitle() {
    return valid.post.title(draft.value.title)
}

const images = useImageUploader('editorImages')
const topics = useTopicManager()

let showDrafts = ref(false)
function viewDraft(existingDraft: Draft) {
    draft.value = existingDraft
    topics.set(existingDraft.topics)
    showDrafts.value = false
}

const submitting = ref<boolean>(false)
async function submit() {
    if (!validTitle()) {
        hints.addError("Title is invalid.")
        return
    }
    if (topics.items.length == 0) {
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
                topics: topics.items,
                comments: [],
                images: images.uploaded.map(i => i.id)
            }
        })
        
        images.uploaded = []
        navigateTo(`/post/${extractId(post.id)}`)
    }
    catch (error: any) {
        hints.addError("Failed to submit post.")
    }
    finally {
        submitting.value = false
    }
}

onKeyStroke(["s", "S"], async (event) => {
    if (event.metaKey || event.ctrlKey) {
        event.preventDefault()
        await saveDraft()
    }
})

const saving = ref<boolean>(false)
async function saveDraft() {
    if (!validTitle()) {
        hints.addError("Title is invalid.")
        return
    }
    try {
        saving.value = true
        if (draft.value.id !== '') {
            await useApi<Draft>(`/api/profile/drafts/${extractId(draft.value.id)}/update`, {
                body: {
                    title: draft.value.title,
                    content: draft.value.content,
                    replyTo: draft.value.replyTo,
                    topics: topics.items,
                    images: images.uploaded.map(i => i.id)
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
                    topics: topics.items,
                    images: images.uploaded.map(i => i.id)
                }
            })
            draft.value.id = response.id
            hints.addSuccess("Draft saved.")
        }
    }
    catch (error: any) {
        hints.addError("Failed to save/update draft.")
    }
    finally {
        saving.value = false
    }
}
</script>

<template>
    <EditorFrame title="New Post" :submitting="submitting" @submit="submit">
        <template #header-actions>
            <button v-if="replyTo" class="reply-to f-1">
                <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                <p class="text bold truncate">{{ replyTo.title }}</p>
            </button>
            <button @click="showDrafts = true">
                <i class="fa-solid fa-compass-drafting"></i>
                <span>Drafts</span>
            </button>
        </template>
        <template #form>
            <div class="field" :class="{ 'invalid': titleFocused && !validTitle() }">
                <label>Title</label>
                <input type="text" v-model="draft.title" @focus="titleFocused = true" @blur="titleFocused = false">
            </div>
            <MarkdownEditor bounded class="f-1" label="Content" :rows="12" v-model="draft.content" />
            <TopicField :topics="topics" />
            <UploadedImages :images="images" />
        </template>
        <template #preview>
            <h1 class="mb-2">{{ draft.title }}</h1>
            <Markdown class="content" :content="draft.content" />
        </template>
        <template #footer-actions>
            <button class="link f-1 b-0" @click="images.select">
                <i class="fa-solid fa-images"></i>
                <span>Upload</span>
            </button>
            <ButtonSpinner v-if="draft.id != ''" class="link f-1 b-0" :loading="saving" @click="saveDraft">
                <i class="fa-solid fa-folder-open"></i>
                <span>Update</span>
            </ButtonSpinner>
            <ButtonSpinner v-else class="link f-1 b-0" :loading="saving" @click="saveDraft">
                <i class="fa-solid fa-folder-open"></i>
                <span>Save</span>
            </ButtonSpinner>
        </template>
        <Drafts v-if="showDrafts" @view="viewDraft" @close="showDrafts = false" />
        <MediaUploader v-if="images.files" :media="images.files" :loading="images.uploading" @upload="images.upload" @close="images.cancel" />
    </EditorFrame>
</template>

<style scoped lang="scss">
button.reply-to {
    color: $white-0;
    background-color: $white-4;
}
</style>