<script setup lang="ts">
import EditorFrame from "./components/EditorFrame.vue"
import UploadedImages from "./components/UploadedImages.vue"

const hints = useHints()

const images = useImageUploader('editorImages')
const topics = useTopicManager()
const description = ref<string>("")
const imageSlides = computed(() => images.uploaded.map((image, index) => ({
    id: image.id,
    url: image.url,
    alt: `${description.value || "Gallery"} image ${index + 1}`,
})))

const submitting = ref<boolean>(false)
async function submit() {
    if (images.uploaded.length == 0) {
        hints.addWarning("You must upload at least one image.")
        return
    }
    if (topics.items.length == 0) {
        hints.addWarning("You must include at least one topic.")
        return
    }

    try {
        submitting.value = true
        await useApi("/api/gallery/publish", {
            body: {
                images: images.uploaded.map(image => image.id),
                description: description.value,
                topics: topics.items,
            },
        })

        images.uploaded = []
        topics.clear()
        description.value = ""
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
    <EditorFrame title="Upload Gallery" :submitting="submitting" @submit="submit">
        <template #header-actions>
            <button @click="images.select">
                <i class="fa-solid fa-images"></i>
                <span>Browse</span>
            </button>
        </template>
        <template #form>
            <UploadedImages size="large" :images="images" />
            <div class="field f-1">
                <label>Description</label>
                <MarkdownEditor bounded class="f-1" :rows="1" v-model="description" />
            </div>
            <TopicField :topics="topics" />
        </template>
        <template #preview>
            <ImageSlideshow :images="imageSlides" label="Uploaded images" />
            <Markdown class="content mt-3" :content="description" />
        </template>
        <OverlayTransition>
            <MediaUploader v-if="images.files" :media="images.files" :loading="images.uploading" @upload="images.upload" @close="images.cancel" />
        </OverlayTransition>
    </EditorFrame>
</template>

