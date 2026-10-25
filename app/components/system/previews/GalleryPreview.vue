<script setup lang="ts">
import type { Gallery } from "@@/shared/types"

const props = defineProps<{
    gallery: Gallery
}>()
</script>

<template>
    <div class="gallery box background">
        <div class="main box column g-2 p-3" @click="navigateTo(`/gallery/${extractId(gallery.id)}`)">
            <header class="row wrap g-1">
                <Votes :target="gallery" />
                <div class="row wrap f-1 g-1">
                    <UserTag class="f-1" :user="gallery.user" />
                    <Tag class="f-1" type="info" icon="fa-chart-simple" :label="gallery.visits" />
                    <DurationTag class="f-1" :time="gallery.time" />
                </div>
                <div v-if="gallery.topics.length > 0" class="row wrap f-1 g-1">
                    <TopicTag v-for="topic in gallery.topics" :key="topic" :topic="topic" />
                </div>
            </header>
            <div v-if="gallery.images.length > 0" class="gallery-images" :class="{ single: gallery.images.length === 1 }">
                <img v-for="image in gallery.images.slice(0, 4)" :key="image.id" :src="image.url">
            </div>
            <p v-if="gallery.images.length > 4" class="more-images">+ {{ gallery.images.length - 4 }} more</p>
            <Markdown v-if="gallery.description" class="content preview" :content="gallery.description" />
        </div>
    </div>
</template>

<style scoped lang="scss">
.main {
    overflow: hidden;
    cursor: pointer;
}

.gallery:hover {
    @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}

.gallery-images {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    max-height: 30rem;
    overflow: hidden;

    img {
        width: 100%;
        aspect-ratio: 4 / 3;
        border-radius: 0.25rem;
        background-color: $white-1;
        object-fit: cover;
    }

    &.single {
        grid-template-columns: minmax(0, 1fr);

        img {
            max-height: 30rem;
            object-fit: cover;
        }
    }
}

.more-images {
    color: $white-0;
}
</style>