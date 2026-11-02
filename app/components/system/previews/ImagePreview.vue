<script setup lang="ts">
import type { Image } from '@@/shared/types'

const props = defineProps<{
    image: Image
}>()

</script>

<template>
    <main class="thread">
        <div class="main box column p-3" @click="navigateTo(`/image/${extractId(image.id)}`)">
            <ContentHeader class="mb-2" :content="image" context="preview" />
            <div class="image">
                <img class="br-small" :src="image.url">
            </div>
        </div>
    </main>
</template>

<style scoped lang="scss">
div.image {
    img {
        width: stretch;
        max-height: 80vh;
        object-fit: cover;
    }
}
</style>