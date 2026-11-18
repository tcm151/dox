<script setup lang="ts">
import type { Gallery } from '@@/shared/types'

const settings = useSettings()
const galleries = useFeedDatasource<Gallery>("/api/gallery", {
    sorting: true,
})
</script>

<template>
    <section class="content-width feed column g-2 p-4">
        <Feed :items="galleries">
            <template #buttons>
                <button class="dark px-5" @click="navigateTo('/editor/image')">
                    <i class="fa-solid fa-images"></i>
                    <span>Submit</span>
                </button>
            </template>
            <template #item="gallery">
                <GalleryPreview :gallery="gallery" />
            </template>
        </Feed>
    </section>
</template>