<script setup lang="ts">
import type { Image } from "~/types"

const hints = useHints()
const session = getSession()

const { data: images, status, refresh } = await useDatasource<Image[]>("/api/image")

const spinRefresh = ref(false)
watch(status, (status) => {
    if (status == "pending") {
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

const showImageUploader = computed(() => {
    return files.value != null && files.value.length >= 1
})

let uploading = ref<boolean>(false)
async function beginUpload() {
    if (!files.value) {
        hints.addWarning("You must select an image.")
        return
    }
    try {
        uploading.value = true
        await uploadMedia<Image>(files.value, "image")
        uploading.value = false
        await refresh()
        reset()
    }
    finally {
        uploading.value = false
    }
}

function viewImage(image: Image) {
    return navigateTo(`/image/${extractId(image.id)}`)
}
</script>

<template>
    <article class="column g-4 p-4">
        <header class="tools box row center-inline g-2 p-4">
            <button class="success" @click="refresh()">
                <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
                <span>Refresh</span>
            </button>
            <ClientOnly>
                <button class="link fill" @click="selectImages()"  v-if="hasTrait(session.user, 'confirmed')">
                    <i class="fa-solid fa-image"></i>
                    <span>Upload</span>
                </button>
                <MediaUploader :visible="showImageUploader" :media="files" @accept="beginUpload" @close="reset" />
            </ClientOnly>
        </header>
        <section class="all-images fill row-wrap g-2">
            <div class="image fill" v-for="image in images" @click="viewImage(image)">
                <img :src="image.url">
            </div>
            <div style="flex: 25 0" />
        </section>
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
        padding: 0.25rem;
        border-radius: 0.25rem;
        border: 2px solid $white-0;
        background-color: $white-0;
        cursor: pointer;
        
        img {
            height: fit-content;
            min-height: 100px;
            max-height: 200px;
            max-width: 100%;
            object-fit: cover;

            @media only screen and (max-width: 800px) {
                min-height: 50px;
                max-height: 100px;
            }

            @media only screen and (max-width: 600px) {
                min-height: 40px;
                max-height: 80px;
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