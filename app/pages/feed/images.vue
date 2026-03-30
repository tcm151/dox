<script setup lang="ts">
import type { Image } from '@@/shared/types'

const { data: images } = await useDatasource<Image[]>("/api/image")
</script>

<template>
    <article class="column g-2 p-4">
        <template v-if="images && images.length > 0">
            <template v-for="image in images" :key="image.id">
                <ImagePreview :image="image" />
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