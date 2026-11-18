<script setup lang="ts">
interface Image {
    id: string
    url: string
    alt: string
}

const props = defineProps<{
    images: Image[]
    label: string
    size?: "small" | "medium" | "large"
    fitHeight?: boolean
}>()

const currentImageIndex = ref(0)
const currentImage = computed(() => props.images[currentImageIndex.value])
const showControls = computed(() => props.images.length > 1)
const slideDirection = ref<"next" | "previous">("next")
const dragOffset = ref(0)
const isDragging = ref(false)

function moveImage(direction: -1 | 1) {
    const imageCount = props.images.length
    if (!imageCount) return

    slideDirection.value = direction > 0 ? "next" : "previous"
    currentImageIndex.value = (currentImageIndex.value + direction + imageCount) % imageCount
}

let pointerStart: { id: number, x: number, y: number } | undefined

function handlePointerDown(event: PointerEvent) {
    if (event.button !== 0 || props.images.length < 2) return

    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY }
    dragOffset.value = 0
    if (event.currentTarget instanceof HTMLImageElement) {
        event.currentTarget.setPointerCapture(event.pointerId)
    }
}

function handlePointerMove(event: PointerEvent) {
    if (!pointerStart || pointerStart.id !== event.pointerId) return

    const deltaX = event.clientX - pointerStart.x
    const deltaY = event.clientY - pointerStart.y
    if (Math.abs(deltaX) < 4 || Math.abs(deltaX) <= Math.abs(deltaY)) return

    isDragging.value = true
    dragOffset.value = deltaX
}

function handlePointerUp(event: PointerEvent) {
    if (!pointerStart || pointerStart.id !== event.pointerId) return

    const deltaX = event.clientX - pointerStart.x
    const deltaY = event.clientY - pointerStart.y
    pointerStart = undefined

    if (Math.abs(deltaX) >= 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (event.currentTarget instanceof HTMLImageElement) {
            event.currentTarget.classList.remove("dragging")
        }
        moveImage(deltaX < 0 ? 1 : -1)
    }
    else {
        dragOffset.value = 0
    }

    isDragging.value = false
}

function handlePointerCancel() {
    pointerStart = undefined
    dragOffset.value = 0
    isDragging.value = false
}

watch(() => props.images.map(image => image.id), () => {
    currentImageIndex.value = 0
})
</script>

<template>
    <section v-if="currentImage" class="slideshow" :class="[size, { 'fit-height': fitHeight }]" :aria-label="label">
        <div class="stage">
            <div v-if="fitHeight" class="sizers" aria-hidden="true">
                <img v-for="image in images" :key="image.id" class="sizer" :src="image.url" alt="" loading="lazy" decoding="async">
            </div>
            <Transition :name="slideDirection">
                <img :key="currentImage.id" class="image br-small" :class="{ dragging: isDragging }" :style="isDragging ? { transform: `translateX(${dragOffset}px)` } : undefined" :src="currentImage.url" :alt="currentImage.alt" loading="eager" decoding="async" draggable="false" @pointerdown="handlePointerDown" @pointermove="handlePointerMove" @pointerup="handlePointerUp" @pointercancel="handlePointerCancel">
            </Transition>
            <span v-if="images.length > 1" class="counter" aria-live="polite" aria-atomic="true">
                {{ currentImageIndex + 1 }} / {{ images.length }}
            </span>
            <template v-if="showControls">
                <button class="arrow previous grid center p-0" type="button" aria-label="Previous image" @click.stop="moveImage(-1)">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <button class="arrow next grid center p-0" type="button" aria-label="Next image" @click.stop="moveImage(1)">
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            </template>
        </div>
    </section>
</template>

<style scoped lang="scss">
.slideshow {
    min-width: 0;

    &.small .stage {
        height: 8rem;
    }

    &.medium .stage {
        height: 12rem;
    }

    &.large .stage {
        height: 16rem;
    }

    .stage {
        position: relative;
        display: grid;
        width: 100%;
        height: min(60vh, 48rem);
        overflow: hidden;
        background-color: $white-1;
    }

    &.fit-height .stage {
        height: auto;
    }

    .sizers {
        display: grid;
        grid-area: 1 / 1;
        width: 100%;
    }

    .sizer {
        grid-area: 1 / 1;
        display: block;
        width: 100%;
        height: auto;
        max-height: min(60vh, 48rem);
        object-fit: contain;
        visibility: hidden;
    }

    .image {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        transition: transform 180ms ease;
        touch-action: pan-y;
        user-select: none;

        &.dragging {
            transition: none;
        }
    }

    .next-enter-active,
    .next-leave-active,
    .previous-enter-active,
    .previous-leave-active {
        transition: transform 300ms ease;
    }

    .next-enter-from {
        transform: translateX(100%);
    }

    .next-leave-to {
        transform: translateX(-100%);
    }

    .previous-enter-from {
        transform: translateX(-100%);
    }

    .previous-leave-to {
        transform: translateX(100%);
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
}

@media (max-width: $bp-mobile) {
    .slideshow {
        .arrow {
            width: 2.25rem;
        }
    }
}
</style>