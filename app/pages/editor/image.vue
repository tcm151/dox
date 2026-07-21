<script setup lang="ts">
import EditorFrame from "./components/EditorFrame.vue"
import UploadedImages from "./components/UploadedImages.vue"

const hints = useHints()

const images = useImageUploader('editorImages')
const topics = useTopicManager()
const summary = ref<string>("")

const submitting = ref<boolean>(false)
async function submit() {
    if (images.uploaded.length == 0) {
        hints.addError("You must upload at least one image.")
        return
    }
    if (summary.value.trim().length < 4) {
        hints.addError("Summary must be at least 4 characters.")
        return
    }
    if (topics.items.length == 0) {
        hints.addError("You must include at least one topic.")
        return
    }

    submitting.value = true
    hints.addWarning("Image publishing is not available yet.")
    submitting.value = false
}
</script>

<template>
    <EditorFrame title="New Image" :submitting="submitting" @submit="submit">
        <template #form>
            <UploadedImages :images="images" />
            <div class="field f-1">
                <label>Summary</label>
                <MarkdownEditor bounded class="f-1" :rows="8" v-model="summary" />
            </div>
            <TopicField :topics="topics" />
        </template>
        <template #preview>
            <div v-if="images.uploaded.length > 0" class="image-preview">
                <img v-for="image in images.uploaded" :src="image.url">
            </div>
            <Markdown class="content mt-3" :content="summary" />
        </template>
        <template #footer-actions>
            <button class="link f-1 b-0" @click="images.select">
                <i class="fa-solid fa-images"></i>
                <span>Upload</span>
            </button>
        </template>
        <MediaUploader v-if="images.files" :media="images.files" :loading="images.uploading" @upload="images.upload" @close="images.cancel" />
    </EditorFrame>
</template>

<style scoped lang="scss">
div.image-preview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    gap: 0.5rem;

    img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: 0.25rem;
        background-color: $white-1;
    }
}
</style>