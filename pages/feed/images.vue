<script setup lang="ts">
import type { Image, User } from "~/types"

const hints = useHints()
const session = getSession()

const { data: images, pending, refresh } = await useAsyncData<Image[]>('images', () => {
    return $fetch("/api/image")
})

const spinRefresh = ref(false)
watch(pending, (loading) => {
    if (loading) {
        spinRefresh.value = true
    }
    else {
        setTimeout(() => spinRefresh.value = false, 512)
    }
})

onMounted(async () => {
    await refresh()
})

const { files, open: selectImages, reset } = useFileDialog({
    accept: "image/*"
})

const confirmImageUpload = ref(false)
watch(files, async () => {
    if (files.value) {
        confirmImageUpload.value = true
    }
})

let uploading = ref<boolean>(false)
async function beginUpload() {
    try {
        confirmImageUpload.value = false
        uploading.value = true
        await uploadImage(files.value)
        uploading.value = false
        await refresh()
        reset()
    }
    catch (ex: any) {
        hints.addError("Failed to upload image.")
    }
}

function cancelUpload() {
    confirmImageUpload.value = false
    reset()
}

const selectedImage = ref<Image | null>(null)

async function deleteSelectedImage() {
    if (!selectedImage.value) {
        hints.addWarning("You haven't selected any image.")
        return
    }

    try {
        await session.useApi(`/api/image/${extractId(selectedImage.value.id)}/delete`)
        hints.addSuccess(`${(selectedImage.value.user as User).name} has been refunded ${selectedImage.value.tokens} tokens.`)
        selectedImage.value = null
        await refresh()
    }
    catch (ex: any) {
        hints.addError(`Failed to delete image. Please try again.`)
    }
}

async function reportSelectedImage() {
    if (!selectedImage.value) {
        hints.addWarning("You haven't selected any image.")
        return
    }

    try {
        await session.useApi(`/api/image/${extractId(selectedImage.value.id)}/report`)
        hints.addError("This image has been reported to the development team.")
    }
    catch (ex: any) {
        hints.addError(`Failed to report image. Please try again.`)
    }
}

</script>

<template>
    <article class="column g-4 p-4">
        <ClientOnly>
            <header class="tools box row center-inline g-2 p-4">
                <button class="success" @click="refresh()">
                    <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
                    <span>Refresh</span>
                </button>
                <button class="link fill" @click="selectImages()"  v-if="session.user.confirmed">
                    <i class="fa-solid fa-image"></i>
                    <span>Upload</span>
                </button>
                <ImageUploader :visible="confirmImageUpload" :images="files" @accept="beginUpload" @close="cancelUpload" />
            </header>
        </ClientOnly>
        <Window
            :visible="selectedImage != null"
            width="800px"
            icon="fa-solid fa-image"
            :title="extractId(selectedImage?.id)"
            @close="selectedImage = null"
        >
            <section class="popup-image column g-2" v-if="selectedImage">
                <header class="row-wrap g-1">
                    <UserTag :fill="1" :user="(selectedImage.user as User)" />
                    <TimeTag :time="selectedImage.time" />
                    <Tag type="info" icon="fa-image" :label="selectedImage.type" />
                    <!-- <Tag type="warning" icon="fa-cube" :label="`${selectedImage.tokens} tokens`" /> -->
                    <Tag type="danger" icon="fa-flag" label="Report" @click="reportSelectedImage" />
                    <Tag
                        v-if="session.user.id == (selectedImage.user as User).id || session.user.admin"
                        type="danger"
                        icon="fa-trash-can"
                        label="Delete"
                        @click="deleteSelectedImage"
                    />
                </header>
                <img :src="selectedImage.url">
            </section>
            
        </Window>
        <section class="all-images fill row-wrap g-2">
            <div class="image fill" v-for="image in images" @click="selectedImage = image">
                <img :src="image.url">
            </div>
            <div style="flex: 25 0" />
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(1200px, 1rem);
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
        border: 2px solid $dox-white-0;
        background-color: $dox-white-0;
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
        border: 2px solid $dox-blue;
    }

}

section.popup-image {
    overflow: hidden;
    
    img {
        height: calc(100% - 2rem);
        border-radius: 0.25rem;
        object-fit: contain;
    }
}

input[type=file]::file-selector-button {
    display: none;
}
</style>