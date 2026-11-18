<script setup lang="ts">
import type { Gallery } from '@@/shared/types'

const galleries = useFeedDatasource<Gallery>("/api/gallery")
</script>

<template>
    <section class="content-width feed column g-2 p-4">
        <Feed :items="galleries">
            <template #item="gallery">
                <GalleryPreview :gallery="gallery" />
            </template>
        </Feed>
    </section>
</template>