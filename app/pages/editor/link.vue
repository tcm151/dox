<script setup lang="ts">
import EditorFrame from "./components/EditorFrame.vue"
import type { Link } from "@@/shared/types"

const hints = useHints()
const valid = useValidation()

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
let autoFilledDescription = ""

const topics = useTopicManager()

const displayTitle = computed(() => title.value || preview.value.title || "")
const displayDescription = computed(() => description.value.trim() || preview.value.description || "")
const domain = computed(() => {
    try {
        return new URL(url.value).hostname.replace(/^www\./i, "")
    }
    catch {
        return url.value
    }
})
const imageUrl = computed(() => {
    const source = preview.value.imageUrl
    if (!source) return

    try {
        const image = new URL(source)
        if (image.protocol !== "https:" || image.username || image.password || image.port) return
        return image.href
    }
    catch {
        return
    }
})

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
    if (autoFilledDescription && description.value === autoFilledDescription) description.value = ""
    autoFilledDescription = ""
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
            if (!description.value.trim() && result.description) {
                description.value = result.description
                autoFilledDescription = result.description
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
                <label for="link-url">Link</label>
                <input id="link-url" type="url" v-model="url" @focus="urlFocused = true" @blur="urlFocused = false" />
            </div>
            <div class="field" :class="{ 'invalid': titleFocused && !validTitle() }">
                <label for="link-title">Title</label>
                <input id="link-title" v-model="title" @focus="titleFocused = true" @blur="titleFocused = false" />
            </div>
            <MarkdownEditor bounded class="f-1" label="Description" :rows="3" :max-length="256" v-model="description" />
            <TopicField :topics="topics" />
        </template>
        <template #preview>
            <div class="box background br-medium">
                <section class="link-detail box br-medium" :aria-busy="previewLoading">
                    <h1 class="mt-2">{{ displayTitle }}</h1>
                    <p class="description mt-3">
                        <span v-if="displayDescription" class="mr-3">{{ displayDescription }} </span>
                        <a v-if="validUrl()" class="destination" :href="url" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">
                            <i class="fa-solid fa-arrow-up-right-from-square mr-1"></i>
                            {{ domain }}
                        </a>
                    </p>
                    <img
                        v-if="imageUrl"
                        class="link-image mt-3"
                        :src="imageUrl"
                        :alt="preview.title || displayTitle"
                        loading="lazy"
                        decoding="async"
                        referrerpolicy="no-referrer"
                    >
                    <p v-if="previewLoading" class="muted mt-2" role="status">Loading preview...</p>
                </section>
            </div>
        </template>
    </EditorFrame>
</template>

<style scoped lang="scss">
.link-detail {
    min-width: 0;

    .description {
        color: $white-3;
        overflow-wrap: anywhere;
    }

    .destination {
        display: inline-block;
        color: $blue;
        font-weight: var(--fw-bold);
        text-decoration: none;
        overflow-wrap: anywhere;

        &:visited {
            color: $purple;
        }

        i {
            font-size: 0.85rem;
        }
    }

    .link-image {
        max-width: 100%;
        max-height: 640px;
        object-fit: contain;
        box-sizing: border-box;
        border: 1px solid $white-1;
        border-radius: 0.25rem;
    }
}
</style>
