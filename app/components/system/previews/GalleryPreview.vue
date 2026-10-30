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
            <header class="row wrap g-1 mb-2">
                <Votes :target="gallery" />
                <div class="row wrap f-1 g-1">
                    <UserTag class="f-1" :user="gallery.user" />
                    <div v-if="gallery.topics.length > 0" class="row wrap f-1 g-1">
                        <TopicTag v-for="topic in gallery.topics" :key="topic" :topic="topic" />
                    </div>
                </div>
                <div class="row wrap g-1">
                    <Tag class="meta" icon="fa-chart-simple" :label="gallery.visits" />
                    <DurationTag class="meta" :time="gallery.time" />
                </div>
            </header>
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