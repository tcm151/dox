<script setup lang="ts">
import type { Image } from '@@/shared/types'

defineProps<{
    images: {
        uploaded: Image[]
        copy: (event: Event) => void
        remove: (image: Image) => void
    }
}>()
</script>

<template>
    <aside v-if="images.uploaded.length > 0" class="field uploaded-images">
        <label>Images</label>
        <div class="row g-2">
            <template v-for="image in images.uploaded">
                <img :src="image.url" @click="images.copy" @contextmenu.prevent="images.remove(image)">
            </template>
        </div>
    </aside>
</template>

<style scoped lang="scss">
.uploaded-images {
    div.row {
        overflow-x: auto;
    }

    img {
        height: 64px;
        max-width: calc(64px + 32px);
        object-fit: contain;
        border-radius: 0.25rem;
        border: 1px solid transparent;
        background-color: $white-1;
    }

    img:hover {
        cursor: pointer;
        border: 1px solid $blue;
    }
}
</style>