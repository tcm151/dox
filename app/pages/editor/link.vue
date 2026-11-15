<script setup lang="ts">
import EditorFrame from "./components/EditorFrame.vue"
import LinkPreview from "~/components/system/previews/LinkPreview.vue"
import type { Link } from "@@/shared/types"

const hints = useHints()
const valid = useValidation()
const session = getSession()

const title = ref<string>("")
const description = ref<string>("")
const url = ref<string>("")
const tags = ref<string[]>([])
const preview = ref<Link["preview"]>({})
const previewLoading = ref(false)
const titleFocused = ref(false)
const urlFocused = ref(false)
let previewRequest = 0
let autoFilledTitle = ""

const topics = useTopicManager()

const previewLink = computed<Link>(() => ({
    id: "preview",
    score: 0,
    votes: { positive: [], misleading: [], negative: [], awards: [], saves: [] },
    time: new Date().toISOString(),
    visits: 0,
    user: session.user as Link["user"],
    title: title.value || preview.value.title || "",
    description: description.value,
    url: url.value,
    preview: preview.value,
    tags: tags.value,
    topics: topics.items,
    comments: [],
    status: "active",
    deleted: false,
    edited: false,
}))

function validTitle() {
    return valid.post.title(title.value)
}

function validUrl() {
    try {
        const parsed = new URL(url.value)
        return parsed.protocol === "http:" || parsed.protocol === "https:"
    }
    catch {
        return false
    }
}

watch(url, (_newUrl, _oldUrl, onCleanup) => {
    const requestId = ++previewRequest
    preview.value = {}
    previewLoading.value = false
    if (autoFilledTitle && title.value === autoFilledTitle) title.value = ""
    autoFilledTitle = ""
    const timer = setTimeout(() => {
        if (requestId === previewRequest && validUrl()) void loadPreview()
    }, 350)
    onCleanup(() => clearTimeout(timer))
})

async function loadPreview() {
    if (!validUrl()) return

    const requestId = ++previewRequest
    const previewUrl = url.value
    previewLoading.value = true
    try {
        const result = await useApi<Link["preview"]>("/api/link/preview", {
            body: { url: previewUrl },
        })
        if (requestId === previewRequest && url.value === previewUrl) {
            preview.value = result
            if (!title.value.trim() && result.title) {
                title.value = result.title
                autoFilledTitle = result.title
            }
        }
    }
    catch {
        if (requestId === previewRequest) preview.value = {}
    }
    finally {
        if (requestId === previewRequest) previewLoading.value = false
    }
}

const submitting = ref<boolean>(false)
async function submit() {
    if (!validTitle()) {
        hints.addWarning("Title is invalid.")
        return
    }
    if (!validUrl()) {
        hints.addWarning("Link URL is invalid.")
        return
    }
    if (topics.items.length == 0) {
        hints.addWarning("You must include at least one topic.")
        return
    }

    try {
        submitting.value = true
        const link = await useApi<Link>("/api/link/add", {
            body: {
                title: title.value,
                description: description.value,
                url: url.value,
                tags: tags.value,
                topics: topics.items,
            },
        })
        await navigateTo(`/link/${extractId(link.id)}`)
    }
    catch (error: any) {
        hints.addError("Failed to submit link.", error)
    }
    finally {
        submitting.value = false
    }
}
</script>

<template>
    <EditorFrame title="New Link" :submitting="submitting" @submit="submit">
        <template #header-actions>
            <ContentTagSelector v-model="tags" />
        </template>
        <template #form>
            <div class="field" :class="{ 'invalid': urlFocused && !validUrl() }">
                <label>Link</label>
                <input type="url" v-model="url" @focus="urlFocused = true" @blur="urlFocused = false" />
            </div>
            <div class="field" :class="{ 'invalid': titleFocused && !validTitle() }">
                <label>Title</label>
                <input v-model="title" @focus="titleFocused = true" @blur="titleFocused = false" />
            </div>
            <div class="field">
                <label>Description</label>
                <MarkdownEditor :rows="3" :max-length="256" v-model="description" />
            </div>
            <TopicField :topics="topics" />
            <div v-if="validUrl()" class="mt-3">
                <LinkPreview :link="previewLink" :loading="previewLoading" :interactive="false" />
            </div>
        </template>
    </EditorFrame>
</template>

<style scoped lang="scss">
.link-preview {
    min-width: 0;
    width: 100%;
}
</style>
