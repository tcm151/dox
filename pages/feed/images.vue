<script setup lang="ts">
import { Image } from "~/types"

const session = getSession()

const { data: images, refresh } = await useAsyncData<Image[]>('images', () => {
    return $fetch("/api/image")
})

const { files, open: selectImages, reset } = useFileDialog({
    accept: "image/*"
})

const confirmImageUpload = ref(false)

let uploading = ref<boolean>(false)
watch(files, async () => {
    if (files.value) {
        confirmImageUpload.value = true
    }
})

async function beginUpload() {
    confirmImageUpload.value = false
    uploading.value = true
    await uploadImage(files.value)
    uploading.value = false
    reset()
}

function cancelUpload() {
    confirmImageUpload.value = false
    reset()
}
</script>

<template>
    <article>
        <section class="column center-inline g-4 p-4">
            <div class="tools fill row center-inline g-2 p-4">
                <button class="success" @click="refresh()">
                    <i class="fa-solid fa-rotate"></i>
                    <span>Refresh</span>
                </button>
                <button class="link" @click="selectImages()">
                    <i class="fa-solid fa-image"></i>
                    <span>Upload</span>
                </button>
                <ImageUploader :visible="confirmImageUpload" :images="files" @accept="beginUpload" @close="cancelUpload" />
            </div>
        </section>
        <section class="all-images fill row-wrap g-4 px-4">
            <!-- <div class="image"> -->
                <img :src="image.url" v-for="image in images">
            <!-- </div> -->
            <div style="flex: 10 0"></div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
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

section.all-images {
    width: 100%;
    justify-content: space-between;
    align-content: flex-start;
    align-items: center;

    img {
        padding: 0.5rem;
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