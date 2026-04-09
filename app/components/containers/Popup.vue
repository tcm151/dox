<script setup lang="ts">
const props = defineProps<{
    title?: string
    width?: string
    height?: string
    loading?: boolean
    accept: { label?: string, action: Function }
    decline: { label?: string, action: Function }
}>()

const maxWidth = ref(`${Number.POSITIVE_INFINITY}px`)
const maxHeight = ref(`${Number.POSITIVE_INFINITY}px`)

function getViewportSize() {
    const viewport = window.visualViewport
    if (viewport && Number.isFinite(viewport.width) && Number.isFinite(viewport.height)) {
        return { width: viewport.width, height: viewport.height }
    }
    return { width: window.innerWidth, height: window.innerHeight }
}

function resizePopup() {
    const vp = getViewportSize()
    maxWidth.value = `calc(${vp.width}px - 2rem)`
    maxHeight.value = `calc(${vp.height}px - 2rem)`
}

if (ENV.isClient()) {
    resizePopup()
    window.visualViewport?.addEventListener('resize', resizePopup)
    window.addEventListener('resize', resizePopup) // fallback path
}

onBeforeUnmount(() => {
    if (!ENV.isClient()) return
    window.visualViewport?.removeEventListener('resize', resizePopup)
    window.removeEventListener('resize', resizePopup)
})
</script>

<template>
    <aside class="background column center">
        <main class="window box br-medium p-5" :style="{ width, maxWidth, maxHeight }">
            <header v-if="title">
                <h1>{{ title }}</h1>
            </header>
            <div class="column py-4">
                <slot />
            </div>
            <div class="row wrap g-2">
                <ButtonSpinner class="success f-1 b-0" :loading="loading" @click="accept.action()">
                    {{ accept.label ?? "Yes" }}
                </ButtonSpinner>
                <button class="danger" @click="decline.action()">
                    {{ decline.label ?? "No" }}
                </button>
            </div>
        </main>
        <aside class="filler" />
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
    animation: blur 64ms forwards;
}

main.window {
    box-shadow: 0.25rem 0.5rem 1rem -0.25rem $white-3, 0 0 0.33rem 1px $white-3;
    animation: fade-in 256ms;

    h1 {
        font-size: 1.5rem;
    }
}

aside.filler {
    height: 20%;
}

.slot {
    max-height: 512px;
}
</style>