<script setup lang="ts">
const props = defineProps<{
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

if (ENV.isClient()) {
    resizePopup()
    window.visualViewport?.addEventListener('resize', resizePopup)
}

function resizePopup() {
    maxWidth.value = `calc(${window.visualViewport!.width}px - 2rem)`
    maxHeight.value = `calc(${window.visualViewport!.height}px - 2rem)`
}

</script>

<template>
    <aside class="background column center">
        <main class="window box br-large column" ref="window" :style="{ width: width, maxWidth: maxWidth, maxHeight: maxHeight }">
            <header class="title-bar row between g-4">
                <div class="left row inline g-2 px-3 py-2">
                    <i v-if="icon" :class="`fa-solid ${icon}`"></i>
                    <h1 v-if="title" class="title">{{ title }}</h1>
                </div>
                <button class="close px-3" @click="emit('close')">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </header>
            <section class="window-slot column p-4">
                <slot />
            </section>
        </main>
        <!-- <div class="filler" /> -->
    </aside>
</template>

<style scoped lang="scss">
aside.background {
    top: 0;
    left: 0;
    position: absolute;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    overflow: hidden;
    animation: blur 64ms forwards;
}

main.window {
    width: min-content;
    animation: fade-in 256ms;
}

header.title-bar {
    color: $white-0;
    background-color: $black-0;
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    user-select: none;

    div.left {
        i {
            font-size: 1.25rem;
        }
    }

    button.close {
        display: grid;
        place-items: center;
        color: $white-0;
        background-color: transparent;
        cursor: pointer;

        i {
            font-size: 1.5rem;
        }
    }
    
    button.close:hover {
        border-radius: 0;
        border-top-right-radius: 0.5rem;
        background-color: $red;
    }
}

section.window-slot {
    border-radius: 0 0 0.5rem 0.5rem;
    border: 1px solid $white-2;
    background-color: $white-0;
    overflow-y: auto;
}

div.filler {
    height: 10%;
}
</style>