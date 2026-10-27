<script setup lang="ts">
const props = defineProps<{
    title?: string
    width?: string
    height?: string
    loading?: boolean
    accept: { label?: string, action: Function }
    decline: { label?: string, action: Function }
}>()
</script>

<template>
    <aside class="background column center">
        <main class="window box br-medium p-5" :style="{ width }">
            <header v-if="title">
                <h1>{{ title }}</h1>
            </header>
            <div class="slot field column g-2 py-4">
                <slot />
            </div>
            <div class="row wrap g-2">
                <ButtonSpinner class="success f-2 b-0" :loading="loading" @click="accept.action()">
                    {{ accept.label ?? "Yes" }}
                </ButtonSpinner>
                <button class="danger f-1" @click="decline.action()">
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
    backdrop-filter: blur(0.5rem);
}

main.window {
    box-shadow: 0.25rem 0.5rem 1rem -0.25rem $white-3, 0 0 0.33rem 1px $white-3;

    h1 {
        font-size: 1.5rem;
    }
}

aside.filler {
    height: 20%;
}

.slot {
    max-height: 100%;
    overflow-y: hidden;
}

</style>