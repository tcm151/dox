<script setup lang="ts">
const props = defineProps<{
    visible: boolean
    icon?: string
    title?: string
    width?: string
    height?: string
}>()

const emit = defineEmits<{
    (event: 'close'): void
}>()

const maxWidth = ref(`${Number.POSITIVE_INFINITY}px`)
const maxHeight = ref(`${Number.POSITIVE_INFINITY}px`)

if (process.client) {
    resizePopup()
    window.visualViewport?.addEventListener('resize', resizePopup)
}

function resizePopup() {
    maxWidth.value = `${window.visualViewport!.width - 25}px`
    maxHeight.value = `${window.visualViewport!.height- 25}px`
}

</script>

<template>
    <!-- TODO use native dialog component -->
    <main class="popup column center" v-if="props.visible">
        <section class="window" ref="window" :style="{ width: width ?? 'fit-content', height: height ?? 'auto', maxWidth: maxWidth, maxHeight: maxHeight }">
            <div class="title-bar">
                <div class="left row center-inline g-2 px-4 py-2">
                    <i :class="icon" v-if="icon"></i>
                    <h2 class="title" v-if="title">{{ title }}</h2>
                </div>
                <div class="close px-3" @click="emit('close')">
                    <i class="fa-solid fa-xmark"></i>
                </div>
            </div>
            <div class="window-slot">
                <slot />
            </div>
        </section>
    </main>
</template>

<style scoped lang="scss">

@keyframes blur {
    from { backdrop-filter: none }
    to { backdrop-filter: blur(0.5rem) }
}

@keyframes fade-in {
    from { opacity: 0% }
    to { opacity: 100% }
}

main.popup {
    top: 0;
    left: 0;
    position: absolute;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    overflow: hidden;
    animation: blur 64ms forwards;
}

section.window {
    position: absolute;

    @include flex-v;
    border-radius: 0.25rem;
    background-color: white;
    box-shadow: 0.25rem 0.5rem 1rem -0.25rem #BBBA, 0 0 0.33rem 1px #CCCA;
    animation: fade-in 256ms;
}

.title-bar {
    @include flex-h (1rem);
    align-items: stretch;
    justify-content: space-between;
    color: $dox-white-ultra;
    background-color: $dox-black;
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    user-select: none;

    div.left {
        i {
            font-size: 1.25rem;
        }
    }

    .close {
        display: grid;
        place-items: center;
        cursor: pointer;

        i {
            font-size: 1.5rem;
        }
    }
    
    .close:hover {
        border-top-right-radius: 0.25rem;
        background-color: $dox-red;
    }
}

.window-slot {
    padding: 1rem;
    @include flex-v;
    border-radius: 0 0 0.25rem 0.25rem;
    background-color: $dox-white-ultra;
    overflow-y: auto;
}
</style>