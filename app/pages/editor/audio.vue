<script setup lang="ts">
import EditorFrame from "./components/EditorFrame.vue"
import type { Audio } from '@@/shared/types'

const hints = useHints()
const session = getSession()

const title = ref<string>("")
const description = ref<string>("")
const uploadedAudio = useSessionStorage<Audio | null>('uploadedAudio', null)

const { files, open: openFileDialog, reset } = useFileDialog({
    accept: "audio/*"
})

let uploading = ref<boolean>(false)
async function beginUpload() {
    if (!files.value) {
        hints.addWarning("Please select an audio file.")
        return
    }
    uploading.value = true
    const audio = await uploadMedia<Audio>(files.value, "audio")
    if (audio != null) {
        uploadedAudio.value = audio
    }
    uploading.value = false
    reset()
}

function selectAudio() {
    if (!hasTrait(session.user, "confirmed")) {
        hints.addWarning("You must confirm your account before uploading audio.")
        return
    }
    openFileDialog()
}

function copyAudioUrl() {
    if (uploadedAudio.value) {
        navigator.clipboard.writeText(uploadedAudio.value.url)
        hints.addSuccess("Copied audio URL.")
    }
}

function clearAudio() {
    uploadedAudio.value = null
    hints.addWarning("Audio removed from this editor.")
}

const topics = useTopicManager()

const submitting = ref<boolean>(false)
async function submit() {
    if (title.value.trim().length < 4) {
        hints.addError("Title must be at least 4 characters.")
        return
    }
    if (!uploadedAudio.value) {
        hints.addError("You must upload an audio file.")
        return
    }
    if (topics.items.length == 0) {
        hints.addError("You must include at least one topic.")
        return
    }

    submitting.value = true
    hints.addWarning("Audio publishing is not available yet.")
    submitting.value = false
}
</script>

<template>
    <EditorFrame title="New Audio" :submitting="submitting" @submit="submit">
        <template #form>
            <div class="field">
                <label>Title</label>
                <input type="text" v-model="title">
            </div>
            <div class="field f-1">
                <label>Description</label>
                <MarkdownEditor bounded class="f-1" :rows="8" v-model="description" />
            </div>
            <aside v-if="uploadedAudio" class="field uploaded-audio">
                <label>Audio</label>
                <div class="row inline g-2">
                    <audio class="f-1" controls :src="uploadedAudio.url" />
                    <button class="link b-0" @click="copyAudioUrl">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                    <button class="danger b-0" @click="clearAudio">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </aside>
            <TopicField :topics="topics" />
        </template>
        <template #preview>
            <h1 class="mb-2">{{ title }}</h1>
            <audio v-if="uploadedAudio" class="preview-audio mb-3" controls :src="uploadedAudio.url" />
            <Markdown class="content" :content="description" />
        </template>
        <template #footer-actions>
            <button class="link f-1 b-0" @click="selectAudio">
                <i class="fa-solid fa-music"></i>
                <span>Upload</span>
            </button>
        </template>
        <MediaUploader v-if="files" :media="files" :loading="uploading" @upload="beginUpload" @close="reset" />
    </EditorFrame>
</template>

<style scoped lang="scss">
aside.uploaded-audio audio,
audio.preview-audio {
    width: 100%;
}

input[type=file] {
    display: none;
}
</style>