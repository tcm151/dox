<script setup lang="ts">
import type { Image } from '@@/shared/types'

defineProps<{
    size: string
    button?: boolean
    images: {
        uploaded: Image[]
        select: (event: Event) => void
        remove: (image: Image) => void
        copy: (event: Event) => void
    }
}>()
</script>

<template>
    <aside v-if="button || images.uploaded.length > 0" class="field uploaded-images">
        <div class="row g-2" :class="size">
            <template v-for="image in images.uploaded">
                <img :src="image.url" @click="images.copy" @contextmenu.prevent="images.remove(image)">
            </template>
            <button v-if="button" class="square" @click="images.select">
                <i class="fa-solid fa-images"></i> Browse
            </button>
        </div>
    </aside>
</template>

<style scoped lang="scss">
.uploaded-images {
    div.row {
        overflow-x: auto;
    }

    button.square {
        aspect-ratio: 1;
    }

    img {
        height: 8rem;
        max-width: calc(8rem + 4rem);
        object-fit: cover;
        border-radius: 0.5rem;
        border: 2px solid transparent;
        background-color: $white-1;
    }

    img:hover {
        cursor: pointer;
        border: 2px solid $blue;
    }

    div.row.small {
        img, button {
            height: 8rem;
            max-width: calc(8rem + 4rem);
        }
    }

    div.row.medium {
        img, button {
            height: 12rem;
            max-width: calc(12rem + 6rem);
        }
    }

    div.row.large {
        img, button {
            height: 16rem;
            max-width: calc(16rem + 8rem);
        }
    }
}
</style>