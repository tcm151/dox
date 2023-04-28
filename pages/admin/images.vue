<script setup lang="ts">
import { Image } from "~/types"

const session = getSession()

const { data: images, refresh } = await useAsyncData('images', () => {
    return $fetch("/api/image")
})

let activeImage = ref<Image | null>(null)

function packageFiles(files: FileList | null) {
    const data = new FormData()
    for (const file of files!) {
        data.append(file.name, file)
    }
    return data
}

async function uploadImage(event: Event) {
    const files = (event.target as HTMLInputElement).files
    activeImage.value = await session.useApi("/api/image/upload", packageFiles(files))
    await refresh()
}
</script>

<template>
    <article>
        <section class="column center-inline g-4 p-4">
            <div class="row">
                <input type="file" @change="uploadImage" />
                <button class="success" @click="uploadImage">
                    <i class="fa-solid fa-cloud-arrow-up"></i>
                    <span>Upload</span>
                </button>
            </div>
            <img :src="activeImage?.url">
        </section>
        <section class="all-images fill row-wrap g-4 px-4">
            <img :src="image.url" v-for="image in images" @click="activeImage = image">
        </section>
    </article>
</template>

<style scoped lang="scss">
img {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
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
    padding: 0.5rem 1rem;

    border: none;
    border-radius: 0.25rem;

    font-size: 1rem;
    font-weight: 700;
    font-family: "Montserrat", sans-serif;

    background-color: $dox-white;
}

input[type=file]::file-selector-button:hover {
    cursor: pointer;
    color: $dox-white-ultra;
    background-color: $dox-grey-light;
}
</style>