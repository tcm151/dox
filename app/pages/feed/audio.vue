<script setup lang="ts">
import type { Audio } from "@@/shared/types"

const session = getSession()

const { data: audio, status, refresh } = await useDatasource<Audio[]>("/api/audio")

const spinRefresh = ref(false)
watch(status, (status) => {
    if (status == "pending") {
        spinRefresh.value = true
    }
    else {
        setTimeout(() => spinRefresh.value = false, 512)
    }
})

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

const selectedAudio = ref<Audio | null>(null)
function viewAudio(audio: Audio) {
    return navigateTo(`/audio/${extractId(audio.id)}`)
}
</script>

<template>
    <article class="column g-4 p-4">
        <header class="tools box row inline g-2 p-4">
            <button class="success" @click="refresh()">
                <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
                <span>Refresh</span>
            </button>
            <ClientOnly>
                <button v-if="hasTrait(session.user, 'confirmed')" class="link f-1" @click="selectAudio()">
                    <i class="fa-solid fa-microphone"></i>
                    <span>Upload</span>
                </button>
                <MediaUploader v-if="confirmUpload" :loading="uploading" :media="files" @accept="beginUpload" @close="reset" />
            </ClientOnly>
        </header>
        <section class="column g-2">
            <div class="audio" v-for="a in audio">
                <audio controls :src="a.url" />
            </div>
            <div style="flex: 25 0" />
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(75rem, 1rem);
}
</style>