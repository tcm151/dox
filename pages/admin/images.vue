<script setup lang="ts">
import { Image } from "~/types"

const hints = useHints()
const session = getSession()

const { data: images, refresh } = await useAsyncData('images', () => {
    return $fetch("/api/image")
})

let activeImage = ref<Image | null>(null)
let uploader = ref<HTMLInputElement>()

function packageFiles(files: FileList | null) {
    const data = new FormData()
    for (const file of files!) {
        data.append(file.name, file)
    }
    return data
}

function chooseFiles() {
    uploader.value?.click()
}

let uploading = ref<boolean>(false)
async function uploadImage() {
    
    if (!uploader.value || !uploader.value.files || uploader.value.files.length == 0) {
        hints.addWarning("Please select an image.")
        return
    }
    
    const files = uploader.value!.files
    const megabytes = files![0].size / 1_048_576
    if (megabytes > 32) {
        hints.addError(`${megabytes} MB`)
        hints.addError("File is too large, try making it smaller.")
        return
    }

    uploading.value = true
    activeImage.value = await session.useApi("/api/image/upload", packageFiles(files))
    hints.addSuccess(`Uploaded file "${files[0].name}" [${megabytes.toFixed(3)} MB]`)
    uploading.value = false
    await refresh()
}

function selectImage(image: Image) {
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
                <button class="success" @click="uploadImage">
                    <i class="fa-solid fa-cloud-arrow-up"></i>
                    <i class="fa-solid fa-spinner" v-if="uploading"></i>
                    <span>Upload</span>
                </button>
                <button class="danger" @click="">
                    <span>Cancel</span>
                </button>
            </div>
            <img :src="activeImage?.url" v-if="activeImage">
        </section>
        <section class="all-images fill row-wrap g-4 px-4">
            <img :src="image.url" v-for="image in images" @click="selectImage(image)" @contextmenu.prevent="deleteImage(image)">
        </section>
    </article>
</template>

<style scoped lang="scss">
img {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
}

div.tools {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}

section.all-images {
    justify-content: center;
    align-items: center;

    img {
        width: 128px;
        height: 128px;
        object-fit: contain;
        border-radius: 0.25rem;
        outline: 1px solid $dox-white;
        background-color: $dox-white;
    }

    img:hover {
        cursor: pointer;
        outline: 1px solid $dox-blue;
    }
}

input[type=file]::file-selector-button {
    display: none;
}
</style>