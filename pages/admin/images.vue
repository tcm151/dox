<script setup lang="ts">
import { Image } from "~/types"

const session = getSession()

const { data: images, refresh } = await useAsyncData<Image[]>('images', () => {
    return $fetch("/api/image")
})

let activeImage = ref<Image | null>(null)
const { files, open: selectImages, reset } = useFileDialog({
    accept: "image/*"
})

let uploading = ref<boolean>(false)
async function startUpload() {
    uploading.value = true
    await uploadImage(files.value)
    uploading.value = false
    await refresh()
    reset()
}

function setActiveImage(image: Image) {
    activeImage.value = (activeImage.value == image) ? null : image
}

async function deleteImage(image: Image) {
    await session.useApi(`/api/image/${extractId(image.id)}/delete`)
    await refresh()
}
</script>

<template>
    <article>
        <section class="column center-inline g-4 p-4">
            <div class="box fill row center-inline g-2 p-4">
                <div class="file-hint fill" v-if="files">
                    <p>{{ files?.[0].name ?? 'No file selected...' }}</p>
                    <h4>~{{ calculateTokens(files[0]) }} tokens </h4>
                </div>
                <button class="link" @click="selectImages()">
                    <span>Select</span>
                    <i class="fa-solid fa-image"></i>
                </button>
                <button class="success" @click="startUpload">
                    <i class="fa-solid fa-spinner" v-if="uploading"></i>
                    <i class="fa-solid fa-cloud-arrow-up" v-else></i>
                    <span>Upload</span>
                </button>
                <button class="danger" @click="reset">
                    <span>Cancel</span>
                </button>
            </div>
            <img class="active-image" :src="activeImage?.url" v-if="activeImage">
        </section>
        <section class="all-images fill row-wrap g-4 px-4">
            <img :src="image.url" v-for="image in images" @click="setActiveImage(image)" @contextmenu.prevent="deleteImage(image)">
            <div style="flex: 10 0"></div>
        </section>
    </article>
</template>

<style scoped lang="scss">
img.active-image {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
}

div.file-hint {
    text-align: center;
}

@keyframes spin {
    from {
        transform: rotateZ(0deg);
    }
    to {
        transform: rotateZ(360deg);
    }
}

.fa-spinner {
    width: 0.75rem;
    animation: spin 1s linear infinite;
}

section.all-images {
    justify-content: space-between;
    align-content: flex-start;
    align-items: center;

    img {
        flex: 1 1 fit-content;
        height: 128px;
        max-width: 256px;
        object-fit: contain;
        border-radius: 0.25rem;
        border: 2px solid $dox-white;
        background-color: $dox-white;
    }

    img:hover {
        cursor: pointer;
        border: 2px solid $dox-blue;
    }
}

input[type=file]::file-selector-button {
    display: none;
}
</style>