<script setup lang="ts">
import type { Audio, User } from "~/types"

const hints = useHints()
const session = getSession()

const { files, open: selectAudio, reset } = useFileDialog({
    accept: "audio/mp3"
})

const confirmUpload = ref(false)
watch(files, async () => {
    if (files.value) {
        confirmUpload.value = true
    }
})

let uploading = ref<boolean>(false)
async function beginUpload() {
    try {
        confirmUpload.value = false
        uploading.value = true
        const audio = await uploadMedia<Audio>(files.value, "audio")
        uploading.value = false
        // await refresh()
        reset()
    }
    catch (ex: any) {
        hints.addError("Failed to upload audio.")
    }
}

function cancelUpload() {
    confirmUpload.value = false
    reset()
}

const selectedAudio = ref<Audio | null>(null)
function viewAudio(audio: Audio) {
    return navigateTo(`/audio/${extractId(audio.id)}`)
}
</script>

<template>
    <article class="column g-4 p-4">
        <ClientOnly>
            <header class="tools box row center-inline g-2 p-4">
                <button class="success" @click="() => { }">
                    <i class="fa-solid fa-rotate" :class="{ spin: false }"></i>
                    <span>Refresh</span>
                </button>
                <button class="link fill" @click="selectAudio()"  v-if="hasTrait(session.user, 'confirmed')">
                    <i class="fa-solid fa-microphone"></i>
                    <span>Upload</span>
                </button>
                <AudioUploader :visible="confirmUpload" :audio="files" @accept="beginUpload" @close="cancelUpload" />
            </header>
        </ClientOnly>
        <!-- <section class="all-images fill row-wrap g-2">
            <div class="image fill" v-for="image in images" @click="viewAudio(image)">
                <img :src="image.url">
            </div>
            <div style="flex: 25 0" />
        </section> -->
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(75rem, 1rem);
}

header.tools {
    button.success {
        i.spin {
            animation: spin 512ms linear infinite;
        }
    }
}

section.all-images {
    justify-content: space-between;
    align-content: flex-start;
    align-items: center;

    div.image {
        padding: 0.5rem;
        border-radius: 0.25rem;
        border: 2px solid $white-0;
        background-color: $white-0;
        cursor: pointer;
        
        img {
            height: 128px;
            max-width: 100%;
            object-fit: contain;

            @media only screen and (max-width: 800px) {
                height: 96px;
            }

            @media only screen and (max-width: 600px) {
                height: 64px;
            }
        }
    }
    
    div.image:hover {
        border: 2px solid $blue;
    }

}

section.popup-image {
    height: 100%;

    figure {
        overflow-y: hidden;
 
        img {
            height: 100%;
            object-fit: contain;
            border-radius: 0.25rem;
        }
    }
}
    

input[type=file]::file-selector-button {
    display: none;
}
</style>