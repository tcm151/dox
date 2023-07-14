<script setup lang="ts">
import { Image } from "~/types"

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
                    <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
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
            <div class="image fill" v-for="image in images">
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

@keyframes spin {
    from {
        transform: rotateZ(0deg);
    }
    to {
        transform: rotateZ(360deg);
    }
}

div.tools {
    // TODO this should be it's own style: box (?)
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;

    button.success {
        i.spin {
            animation: spin 512ms linear infinite;
        }
    }
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
    justify-content: space-between;
    align-content: flex-start;
    align-items: center;

    div.image {
        padding: 0.5rem;
        border-radius: 0.25rem;
        border: 2px solid $dox-white-ultra;
        background-color: $dox-white-ultra;
        cursor: pointer;
        
        img {
            height: 128px;
            max-width: 100%;
            object-fit: contain;
        }
    }
    
    div.image:hover {
        border: 2px solid $dox-blue;
    }

}

input[type=file]::file-selector-button {
    display: none;
}
</style>