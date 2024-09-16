<script setup lang="ts">
import type { Image, User } from "~/types"

const hints = useHints()
const session = getSession()

const { data: images, pending, refresh } = await useLazyAsyncData('images', () => {
    return $fetch<Image[]>("/api/image")
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

const showImageUploader = computed(() => {
    return files.value != null && files.value.length >= 1
})

let uploading = ref<boolean>(false)
async function beginUpload() {
    try {
        uploading.value = true
        await uploadImage(files.value)
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
        <ClientOnly>
            <header class="tools box row center-inline g-2 p-4">
                <button class="success" @click="refresh()">
                    <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
                    <span>Refresh</span>
                </button>
                <button class="link fill" @click="selectImages()"  v-if="hasTrait(session.user, 'confirmed')">
                    <i class="fa-solid fa-image"></i>
                    <span>Upload</span>
                </button>
                <ImageUploader :visible="showImageUploader" :images="files" @accept="beginUpload" @close="reset" />
            </header>
        </ClientOnly>
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