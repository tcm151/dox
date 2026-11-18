<script setup lang="ts">
import type { Gallery } from "@@/shared/types"

const props = defineProps<{
    gallery: Gallery
    pinned?: boolean
}>()

const imageSlides = computed(() => props.gallery.images.map((image, index) => ({
    id: image.id,
    url: image.url,
    alt: `${props.gallery.description || "Gallery"} image ${index + 1}`,
})))
</script>

<template>
    <ContentVisibility :tags="gallery.tags">
        <div class="gallery box background animate hover-shadow" :class="{ pinned }">
            <div class="main clickable box column p-3" @click="navigateTo(`/gallery/${extractId(gallery.id)}`)">
                <ContentHeader class="mb-2" :content="gallery" :pinned="pinned" />
                <h3 class="title text left mb-2">{{ gallery.title }}</h3>
                <ImageSlideshow :images="imageSlides" label="Gallery images" fit-height />
            </div>
        </div>
    </ContentVisibility>
</template>

<style scoped lang="scss">
.main {
    overflow: hidden;
}

.title {
    overflow-wrap: anywhere;
}

.gallery.pinned .main {
    border: 2px solid $white-2;
}
</style>