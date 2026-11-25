<script setup lang="ts">
import EditorFrame from "./components/EditorFrame.vue"
import UploadedImages from "./components/UploadedImages.vue"

const hints = useHints()
const settings = useSettings()

const images = useImageUploader('editorImages')
const topics = useTopicManager()
const title = ref<string>("")
const description = ref<string>("")
const tags = ref<string[]>([])
const imageSlides = computed(() => images.uploaded.map((image, index) => ({
    id: image.id,
    url: image.url,
    alt: `${title.value} image ${index + 1}`,
})))

const submitting = ref<boolean>(false)
async function submit() {
    if (!settings.app.media.images.enabled || !settings.app.media.gallery.enabled) {
        hints.addMessage("Gallery publishing is not enabled.")
        return
    }
    if (images.uploaded.length == 0) {
        hints.addWarning("You must upload at least one image.")
        return
    }
    if (topics.items.length == 0) {
        hints.addWarning("You must include at least one topic.")
        return
    }
    if (title.value.length < 4 || title.value.length > 128) {
        hints.addWarning("Gallery titles must be between 4 and 128 characters.")
        return
    }

    try {
        submitting.value = true
        await useApi("/api/gallery/publish", {
            body: {
                images: images.uploaded.map(image => image.id),
                title: title.value,
                description: description.value,
                tags: tags.value,
                topics: topics.items,
            },
        })

        images.uploaded = []
        topics.clear()
        description.value = ""
        tags.value = []
        hints.addSuccess("Images published.")
        await navigateTo("/feed/gallery")
    }
    catch (error: any) {
        hints.addError("Failed to publish images.", error)
    }
    finally {
        submitting.value = false
    }
}
</script>

<template>
    <EditorFrame title="New Gallery" :submitting="submitting" @submit="submit">
        <template #header-actions>
            <ContentTagSelector v-model="tags" />
            <button v-if="settings.app.media.images.enabled" @click="images.select">
                <i class="fa-solid fa-images"></i>
                <span>Browse</span>
            </button>
        </template>
        <template #form>
            <UploadedImages size="large" :images="images" />
            <div class="field">
                <label>Title</label>
                <input v-model="title" maxlength="128" />
            </div>
            <div class="field f-1">
                <label>Description</label>
                <MarkdownEditor bounded class="f-1" :rows="1" :max-length="256" v-model="description" />
            </div>
            <TopicField :topics="topics" />
        </template>
        <template #preview>
            <div class="column g-3">
                <h2 class="title text left">{{ title }}</h2>
                <ImageSlideshow :images="imageSlides" label="Uploaded images" />
                <Markdown compact class="content" :content="description" />
            </div>
        </template>
        <OverlayTransition>
            <MediaUploader v-if="images.files" :media="images.files" :loading="images.uploading" @upload="images.upload" @close="images.cancel" />
        </OverlayTransition>
    </EditorFrame>
</template>
