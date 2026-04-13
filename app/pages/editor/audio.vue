<script setup lang="ts">
import type { User, Thread } from '@@/shared/types'

const hints = useHints()
const cache = useCache()
const session = getSession()

const { files, open: selectAudio, reset } = useFileDialog({
    accept: "audio/mp3"
})

const confirmUpload = computed(() => files.value != null)
let uploading = ref<boolean>(false)
async function beginUpload() {
    try {
        console.log(files.value)
        // uploading.value = true
        // await uploadMedia<Audio>(files.value, "audio")
        // reset()
    }
    finally {
        uploading.value = false
    }
}

const newTopic = ref<string>("")
const topics = ref<string[]>([])
function addTopic(topic: string) {
    topics.value.push(`topic:${topic}`)
    newTopic.value = ""
}

function removeTopic(topic: string) {
    topics.value = topics.value.filter(t => t !== topic)
}

const submitting = ref<boolean>(false)
async function submit() {
    try {
        submitting.value = true
        const thread = await useApi<Thread>("/api/thread/add", {
        })
        return navigateTo(`/thread/${extractId(thread.id)}`)
    }
    catch (error: any) {
        hints.addError("Failed to submit thread.")
    }
    finally {
        submitting.value = false
    }
}

</script>

<template>
    <article class="column m-4">
        <section class="box column p-5">
            <header class="row inline between mb-4">
                <h1>New Audio</h1>
                <!-- FIXME drafts button has empty click handler; wire to drafts flow or hide until implemented. -->
                <button @click="">
                    <i class="fa-solid fa-compass-drafting"></i>
                    <span>Drafts</span>
                </button>
            </header>
            <section class="form f-1 column g-2">
                <div class="field">
                    <label>Audio</label>
                    <input type="text">
                </div>
                <TopicField v-model:text="newTopic" :topics="[]" @add="addTopic" @remove="removeTopic" />
                <MediaUploader v-if="files" :media="files" :loading="uploading" @accept="beginUpload" @close="reset" />
            </section>
            <footer class="row g-2 mt-5">
                <ButtonSpinner class="success f-1 b-0" :loading="submitting" @click="submit">
                    <i class="fa-solid fa-share"></i>
                    <span>Submit</span>
                </ButtonSpinner>
                <button class="link f-1 b-0" @click="">
                    <i class="fa-solid fa-music"></i>
                    <span>Upload</span>
                </button>
            </footer>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width (60rem, 1rem);
}
</style>