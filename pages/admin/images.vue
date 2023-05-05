<script setup lang="ts">
import { Image } from "~/types"

const session = getSession()

const { data: images, refresh } = await useAsyncData('images', () => {
    return $fetch("/api/image")
})

let activeImage = ref<Image | null>(null)
let uploader = ref<HTMLInputElement>()

function chooseFiles() {
    uploader.value?.click()
}

let uploading = ref<boolean>(false)
async function startUpload() {
    uploading.value = true
    console.log(await uploadImage(uploader.value!))
    uploading.value = false
    await refresh()
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
            <div class="tools row center-inline g-2 p-4">
                <button class="link" @click="chooseFiles">
                    <span>Select</span>
                    <i class="fa-solid fa-image"></i>
                </button>
                <input accept="image/*" ref="uploader" type="file" />
                <button class="success" @click="startUpload">
                    <i class="fa-solid fa-spinner" v-if="uploading"></i>
                    <i class="fa-solid fa-cloud-arrow-up" v-else></i>
                    <span>Upload</span>
                </button>
                <button class="danger" @click="">
                    <span>Cancel</span>
                </button>
            </div>
            <img class="active-image" :src="activeImage?.url" v-if="activeImage">
        </section>
        <section class="all-images fill row-wrap g-4 px-4">
            <img :src="image.url" v-for="image in images" @click="setActiveImage(image)" @contextmenu.prevent="deleteImage(image)">
        </section>
    </article>
</template>

<style scoped lang="scss">
img.active-image {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
}

div.tools {
    // TODO this should be it's own style: box (?)
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
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
    justify-content: center;
    align-items: center;

    img {
        height: 128px;
        max-width: calc(128px + 64px);
        object-fit: scale-down;
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