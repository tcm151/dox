<script setup lang="ts">
interface SlideImage {
    id: string
    url: string
    alt: string
}

interface DisplaySlide extends SlideImage {
    key: string
    clone: "start" | "end" | null
}

const props = defineProps<{
    images: SlideImage[]
    label: string
    size?: "small" | "medium" | "large"
    interactive?: boolean
}>()

const emit = defineEmits<{
    (eventName: "image-click", mouseEvent: MouseEvent): void
    (eventName: "image-contextmenu", image: SlideImage): void
}>()

const displaySlides = computed<DisplaySlide[]>(() => {
    if (props.images.length < 2) {
        return props.images.map(image => ({ ...image, key: image.id, clone: null }))
    }

    const first = props.images[0]!
    const last = props.images[props.images.length - 1]!
    return [
        { ...last, key: `clone-start-${last.id}`, clone: "start" },
        ...props.images.map(image => ({ ...image, key: image.id, clone: null })),
        { ...first, key: `clone-end-${first.id}`, clone: "end" },
    ]
})

const imageStrip = ref<HTMLOListElement | null>(null)
const hasOverflow = ref(false)
const currentImageIndex = ref(1)
const showScrollControls = computed(() => hasOverflow.value && props.images.length > 1)
let resizeObserver: ResizeObserver | undefined
let pointerActive = false

function updateOverflow() {
    const strip = imageStrip.value
    if (!strip) {
        hasOverflow.value = false
        return
    }

    const slides = Array.from(strip.querySelectorAll<HTMLElement>(".slide:not(.clone)"))
    const lastSlide = strip.querySelector<HTMLElement>(".slide.clone-end")
        ?? slides[slides.length - 1]
    if (!slides.length || !lastSlide) {
        hasOverflow.value = false
        return
    }

    const styles = getComputedStyle(strip)
    const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0
    const paddingRight = Number.parseFloat(styles.paddingRight) || 0
    const gap = Number.parseFloat(styles.columnGap) || 0
    const contentWidth = slides.reduce((width, slide) => width + slide.offsetWidth, 0)
        + gap * (slides.length - 1) + paddingLeft + paddingRight
    const overflowing = contentWidth > strip.clientWidth + 1
    const trailingSpace = overflowing
        ? Math.max(0, (strip.clientWidth - lastSlide.offsetWidth) / 2 - paddingRight - gap)
        : 0

    strip.style.setProperty("--trailing-space", `${trailingSpace}px`)
    hasOverflow.value = overflowing
}

function closestSlideIndex(strip: HTMLOListElement, slides: HTMLElement[]) {
    const stripBounds = strip.getBoundingClientRect()
    const stripCenter = stripBounds.left + strip.clientWidth / 2
    return slides.reduce((closestIndex, slide, index) => {
        const slideCenter = slide.getBoundingClientRect().left + slide.offsetWidth / 2
        const closestSlide = slides[closestIndex]
        if (!closestSlide) return index
        const closestCenter = closestSlide.getBoundingClientRect().left + closestSlide.offsetWidth / 2
        return Math.abs(slideCenter - stripCenter) < Math.abs(closestCenter - stripCenter)
            ? index
            : closestIndex
    }, 0)
}

function centerSlide(slide: HTMLElement, behavior: ScrollBehavior = "smooth") {
    const strip = imageStrip.value
    if (!strip) return

    const stripBounds = strip.getBoundingClientRect()
    const stripCenter = stripBounds.left + strip.clientWidth / 2
    const targetCenter = slide.getBoundingClientRect().left + slide.offsetWidth / 2
    const left = strip.scrollLeft + targetCenter - stripCenter
    if (behavior === "auto") {
        strip.scrollLeft = left
    }
    else {
        strip.scrollTo({ left, behavior })
    }
}

function moveImages(direction: -1 | 1) {
    const strip = imageStrip.value
    if (!strip) return

    const slides = Array.from(strip.querySelectorAll<HTMLElement>(".slide"))
    if (!slides.length) return

    const currentIndex = closestSlideIndex(strip, slides)
    const targetIndex = Math.max(0, Math.min(slides.length - 1, currentIndex + direction))
    const targetSlide = slides[targetIndex]
    if (!targetSlide) return

    centerSlide(targetSlide)
}

function normalizeClone() {
    const strip = imageStrip.value
    if (!strip) return

    const slides = Array.from(strip.querySelectorAll<HTMLElement>(".slide"))
    const currentIndex = closestSlideIndex(strip, slides)
    const targetSlide = currentIndex === 0
        ? slides[slides.length - 2]
        : currentIndex === slides.length - 1
            ? slides[1]
            : undefined

    if (targetSlide) centerSlide(targetSlide, "auto")
}

function updateCurrentImage() {
    const strip = imageStrip.value
    if (!strip || !props.images.length) return

    const slides = Array.from(strip.querySelectorAll<HTMLElement>(".slide"))
    const index = closestSlideIndex(strip, slides)
    currentImageIndex.value = index === 0
        ? props.images.length
        : index === slides.length - 1
            ? 1
            : index
}

function shouldPreload(image: DisplaySlide) {
    const imageCount = props.images.length
    if (!imageCount) return false

    const imageIndex = props.images.findIndex(item => item.id === image.id)
    const currentIndex = currentImageIndex.value - 1
    return imageIndex >= 0 && (imageIndex - currentIndex + imageCount) % imageCount <= 2
}

function handleScrollEnd() {
    const strip = imageStrip.value
    if (!strip || pointerActive) return

    requestAnimationFrame(() => {
        if (imageStrip.value !== strip || pointerActive || strip.classList.contains("settling")) return
        normalizeClone()
        updateCurrentImage()
    })
}

function handlePointerDown() {
    pointerActive = true
}

function handlePointerEnd() {
    pointerActive = false
}

async function resetImageStrip() {
    await nextTick()
    resizeObserver?.disconnect()

    const strip = imageStrip.value
    if (!strip) {
        hasOverflow.value = false
        return
    }

    strip.scrollLeft = 0
    strip.style.setProperty("--trailing-space", "0px")
    resizeObserver ??= new ResizeObserver(updateOverflow)
    resizeObserver.observe(strip)
    updateOverflow()
    const firstSlide = strip.querySelector<HTMLElement>(".slide:not(.clone)")
    if (firstSlide) centerSlide(firstSlide, "auto")
    updateCurrentImage()
}

function handleImageContextMenu(event: MouseEvent, image: DisplaySlide) {
    if (!props.interactive) return
    event.preventDefault()
    if (image.clone) return
    emit("image-contextmenu", image)
}

watch(() => JSON.stringify(props.images.map(image => image.id)), resetImageStrip)
onMounted(resetImageStrip)
onBeforeUnmount(() => {
    resizeObserver?.disconnect()
})
</script>

<template>
    <section v-if="images.length > 0" class="slideshow" :class="[size, { interactive }]" :aria-label="label">
        <div class="stage">
            <ol
                ref="imageStrip"
                class="strip row g-3 p-2 m-0"
                :class="{ 'drag-enabled': showScrollControls }"
                v-drag-scroll
                @pointerdown="handlePointerDown"
                @pointerup="handlePointerEnd"
                @pointercancel="handlePointerEnd"
                @scrollend="handleScrollEnd"
                aria-label="Images"
            >
                <li
                    v-for="image in displaySlides"
                    :key="image.key"
                    class="slide m-0"
                    :class="{ clone: image.clone, 'clone-end': image.clone === 'end' }"
                    :aria-hidden="!!image.clone"
                >
                    <img
                        class="br-small"
                        :src="image.url"
                        :alt="image.clone ? '' : image.alt"
                        :loading="shouldPreload(image) ? 'eager' : 'lazy'"
                        decoding="async"
                        draggable="false"
                        @load="updateOverflow"
                        @click="!image.clone && emit('image-click', $event)"
                        @contextmenu="handleImageContextMenu($event, image)"
                    >
                </li>
            </ol>
            <span v-if="images.length > 1" class="counter" aria-live="polite" aria-atomic="true">
                {{ currentImageIndex }} / {{ images.length }}
            </span>
            <template v-if="showScrollControls">
                <button class="arrow previous grid center p-0" type="button" aria-label="Previous image" @click.stop="moveImages(-1)">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <button class="arrow next grid center p-0" type="button" aria-label="Next image" @click.stop="moveImages(1)">
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
        width: 100%;
        height: min(60vh, 48rem);
        overflow: hidden;
        background-color: $white-1;
    }

    .strip {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        list-style: none;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        scroll-snap-type: x mandatory;

        &::after {
            content: "";
            flex: 0 0 0;
        }

        &::after {
            flex-basis: var(--trailing-space, 0px);
        }

        &::-webkit-scrollbar {
            display: none;
        }

        &.drag-enabled {
            cursor: grab;
            user-select: none;
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
        background-color: $white-1;
        scroll-snap-align: center;

        img {
            display: block;
            width: auto;
            height: 100%;
            object-fit: cover;
        }

        &:only-child {
            position: relative;
            width: 100%;

            img {
                inset: 0;
                width: 100%;
                position: absolute;
                object-position: center;
            }
        }
    }

    &.interactive .slide img {
        cursor: pointer;
        border: 2px solid transparent;

        &:hover {
            border-color: $blue;
        }
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
        display: grid;
        min-width: 2.5rem;
        height: 2rem;
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