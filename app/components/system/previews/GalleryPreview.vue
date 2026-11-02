<script setup lang="ts">
import type { Gallery } from "@@/shared/types"

const props = defineProps<{
    gallery: Gallery
}>()

const imageSlides = computed(() => props.gallery.images.map((image, index) => ({
    id: image.id,
    url: image.url,
    alt: `${props.gallery.description || "Gallery"} image ${index + 1}`,
})))
</script>

<template>
    <div class="box background animate hover-shadow">
        <div class="main clickable box column p-3" @click="navigateTo(`/gallery/${extractId(gallery.id)}`)">
            <ContentHeader class="mb-2" :content="gallery" context="preview" />
            <ImageSlideshow :images="imageSlides" label="Gallery images" />
            <!-- <Markdown v-if="gallery.description" class="content preview" :content="gallery.description" /> -->
        </div>
    </div>
</template>

<style scoped lang="scss">
.main {
    overflow: hidden;
}
</style>