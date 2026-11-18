<script setup lang="ts">
import type { Image } from '@@/shared/types'

const props = defineProps<{
    size: "small" | "medium" | "large"
    button?: boolean
    images: {
        uploaded: Image[]
        select: (event: Event) => void
        remove: (image: Image) => void
        copy: (event: Event) => void
    }
}>()

const slides = computed(() => props.images.uploaded.map((image, index) => ({
    id: image.id,
    url: image.url,
    alt: image.name || `Uploaded image ${index + 1}`,
})))

const currentImageIndex = ref(0)
const imageStrip = ref<HTMLOListElement | null>(null)

function moveImage(direction: -1 | 1) {
    const imageCount = slides.value.length
    const strip = imageStrip.value
    if (imageCount < 2 || !strip) return

    currentImageIndex.value = (currentImageIndex.value + direction + imageCount) % imageCount
    const slide = strip.children[currentImageIndex.value]
    if (!(slide instanceof HTMLElement)) return

    const stripBounds = strip.getBoundingClientRect()
    const slideBounds = slide.getBoundingClientRect()
    strip.scrollTo({
        left: strip.scrollLeft + slideBounds.left + slideBounds.width / 2 - stripBounds.left - strip.clientWidth / 2,
        behavior: "smooth",
    })
}

function handleImageClick(event: MouseEvent, index: number) {
    currentImageIndex.value = index
    props.images.copy(event)
}

function removeImage(slide: { id: string }) {
    const image = props.images.uploaded.find(uploaded => uploaded.id === slide.id)
    if (image) props.images.remove(image)
}

function handleImageContextMenu(event: MouseEvent, image: { id: string }) {
    event.preventDefault()
    removeImage(image)
}

watch(() => props.images.uploaded.map(image => image.id), () => {
    currentImageIndex.value = 0
    if (imageStrip.value) imageStrip.value.scrollLeft = 0
})
</script>

<template>
    <aside v-if="button || images.uploaded.length > 0" class="field uploaded-images">
        <div class="row g-2" :class="size">
            <section v-if="slides.length > 0" class="image-strip f-1" :class="size" aria-label="Uploaded images">
                <div class="stage">
                    <ol ref="imageStrip" class="strip row g-3 m-0" v-drag-scroll>
                        <li v-for="(image, index) in slides" :key="image.id" class="slide m-0" :class="{ current: index === currentImageIndex }">
                            <img class="image br-small" :src="image.url" :alt="image.alt" loading="eager" decoding="async" draggable="false" @click="handleImageClick($event, index)" @contextmenu="handleImageContextMenu($event, image)">
                        </li>
                    </ol>
                    <span v-if="slides.length > 1" class="counter" aria-live="polite" aria-atomic="true">
                        {{ currentImageIndex + 1 }} / {{ slides.length }}
                    </span>
                    <template v-if="slides.length > 1">
                        <button class="arrow previous grid center p-0" type="button" aria-label="Previous image" @click.stop="moveImage(-1)">
                            <i class="fa-solid fa-arrow-left"></i>
                        </button>
                        <button class="arrow next grid center p-0" type="button" aria-label="Next image" @click.stop="moveImage(1)">
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </template>
                </div>
            </section>
            <button v-if="button" class="square" @click="images.select">
                <i class="fa-solid fa-images"></i> Browse
            </button>
        </div>
    </aside>
</template>

<style scoped lang="scss">
.uploaded-images {
    div.row {
        align-items: flex-start;
    }

    button.square {
        aspect-ratio: 1;
    }

    .image-strip {
        min-width: 0;
        width: 100%;
        height: 10rem;

        &.small {
            height: 6rem;
        }

        &.medium {
            height: 8rem;
        }
    }

    .stage {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .strip {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 0;
        list-style: none;
        scrollbar-width: none;
        scroll-snap-type: x mandatory;
        cursor: grab;
        user-select: none;

        &::-webkit-scrollbar {
            display: none;
        }

        &.dragging {
            cursor: grabbing;
        }

        &.dragging,
        &.settling {
            scroll-snap-type: none;
        }
    }

    .slide {
        flex: 0 0 auto;
        height: 100%;
        overflow: hidden;
        scroll-snap-align: center;
    }

    .image {
        display: block;
        box-sizing: border-box;
        width: auto;
        height: 100%;
        object-fit: contain;
        cursor: pointer;
        border: 2px solid transparent;

        &:hover {
            border-color: $blue;
        }
    }

    .slide.current .image {
        outline: 2px solid $blue;
        outline-offset: -2px;
    }

    .arrow {
        position: absolute;
        top: 50%;
        z-index: 1;
        width: 2.5rem;
        aspect-ratio: 1;
        transform: translateY(-50%);
        border-radius: 50%;
        color: $white-0;
        background: rgba(0, 0, 0, 0.68);

        &.previous {
            left: 0.75rem;
        }

        &.next {
            right: 0.75rem;
        }
    }

    .counter {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        z-index: 1;
        height: 2rem;
        min-width: 2.5rem;
        display: grid;
        place-items: center;
        padding: 0 0.65rem;
        border-radius: 1rem;
        color: $white-0;
        background: rgba(0, 0, 0, 0.68);
        font-size: 0.875rem;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        pointer-events: none;
    }

    div.row.small {
        button.square {
            height: 8rem;
        }
    }

    div.row.medium {
        button.square {
            height: 12rem;
        }
    }

    div.row.large {
        button.square {
            height: 16rem;
        }
    }
}

@media (max-width: $bp-mobile) {
    .uploaded-images {
        .arrow {
            width: 2.25rem;
        }
    }
}
</style>