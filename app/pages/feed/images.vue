<script setup lang="ts">
import type { Gallery } from '@@/shared/types'

const { data: galleries } = await useDatasource<Gallery[]>("/api/gallery")
</script>

<template>
    <article class="column g-2 p-4">
        <template v-if="galleries && galleries.length > 0">
            <template v-for="gallery in galleries" :key="gallery.id">
                <GalleryPreview :gallery="gallery" />
            </template>
        </template>
        <template v-else>
            <div class="column center box p-4">
                There is nothing here currently.
            </div>
        </template>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>