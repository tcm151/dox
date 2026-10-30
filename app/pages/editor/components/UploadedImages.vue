<script setup lang="ts">
import type { Image } from '@@/shared/types'

const props = defineProps<{
    size: "small" | "medium" | "large"
    button?: boolean
    images: {
        uploaded: Image[]
        select: (event: Event) => void
        remove: (image: Image) => void
        copy: (event: Event) => void
    }
}>()

const slides = computed(() => props.images.uploaded.map((image, index) => ({
    id: image.id,
    url: image.url,
    alt: image.name || `Uploaded image ${index + 1}`,
})))

function removeImage(slide: { id: string }) {
    const image = props.images.uploaded.find(uploaded => uploaded.id === slide.id)
    if (image) props.images.remove(image)
}
</script>

<template>
    <aside v-if="button || images.uploaded.length > 0" class="field uploaded-images">
        <div class="row g-2" :class="size">
            <ImageSlideshow
                v-if="images.uploaded.length > 0"
                class="f-1"
                :images="slides"
                label="Uploaded images"
                :size="size"
                interactive
                @image-click="images.copy"
                @image-contextmenu="removeImage"
            />
            <button v-if="button" class="square" @click="images.select">
                <i class="fa-solid fa-images"></i> Browse
            </button>
        </div>
    </aside>
</template>

<style scoped lang="scss">
.uploaded-images {
    div.row {
        align-items: flex-start;
    }

    button.square {
        aspect-ratio: 1;
    }

    div.row.small {
        button {
            height: 8rem;
        }
    }

    div.row.medium {
        button {
            height: 12rem;
        }
    }

    div.row.large {
        button {
            height: 16rem;
        }
    }
}
</style>