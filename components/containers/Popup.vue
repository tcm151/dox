<script setup lang="ts">
const props = defineProps<{
    visible: boolean
    title?: string
    width?: string
    height?: string
    loading?: boolean
    acceptLabel?: string
    declineLabel?: string
}>()

const emit = defineEmits<{
    (event: 'accept'): void
    (event: 'decline'): void
}>()

const maxWidth = ref(`${Number.POSITIVE_INFINITY}px`)
const maxHeight = ref(`${Number.POSITIVE_INFINITY}px`)

if (import.meta.client) {
    resizePopup()
    window.visualViewport?.addEventListener('resize', resizePopup)
}

function resizePopup() {
    maxWidth.value = `${window.visualViewport!.width - 50}px`
    maxHeight.value = `${window.visualViewport!.height- 50}px`
}

</script>

<template>
    <aside class="background column center" v-if="props.visible">
        <main class="window p-5" :style="{ width, maxWidth, maxHeight }">
            <header class="" v-if="title">
                <h1>{{ title }}</h1>
            </header>
            <div class="column px-4">
                <slot />
            </div>
            <div class="row-wrap g-2">
                <ButtonSpinner class="success f-1 b-0" :loading="loading" @click="emit('accept')">
                    {{ acceptLabel ?? "Yes" }}
                </ButtonSpinner>
                <button class="danger f-1 b-0" @click="emit('decline')">
                    {{ declineLabel ?? "No" }}
                </button>
            </div>
        </main>
        <aside class="filler" />
    </aside>
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
    box-sizing: border-box;
    border-radius: 0.5rem;
    background-color: $white-0;
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