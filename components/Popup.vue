<script setup lang="ts">
const props = defineProps<{
    visible: boolean
    title?: string
    width?: string
    height?: string
    acceptLabel?: string
    declineLabel?: string
}>()

const emit = defineEmits<{
    (event: 'accept'): void
    (event: 'decline'): void
}>()
</script>

<template>
    <div class="popup" v-if="props.visible">
        <div class="window p-5" :style="{ width: width ?? 'fit-content', height: height ?? 'auto' }">
            <h1 v-if="title">{{ title }}</h1>
            <div class="slot">
                <slot />
            </div>
            <div class="row g-2">
                <button class="success" @click="$emit('accept')">{{ acceptLabel ?? "Yes" }}</button>
                <button class="danger" @click="$emit('decline')">{{ declineLabel ?? "No" }}</button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";

@keyframes blur {
    from { backdrop-filter: none }
    to { backdrop-filter: blur(0.5rem) }
}

.popup {
    top: 0;
    left: 0;
    position: absolute;
    width: 100vw;
    height: 100vh;

    @include flex-v;
    align-items: center;
    justify-content: center;
    background-color: #0005;
    animation: blur 64ms forwards;
}

@keyframes fade-in {
    from { opacity: 0% }
    to { opacity: 100% }
}

.window {
    width: fit-content;
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
    box-shadow: 0.25rem 0.5rem 1rem -0.25rem #BBBA, 0 0 0.33rem 1px #CCCA;
    animation: fade-in 256ms;
}

.slot {
    @include flex-v;
    padding: 1rem 0;
    max-height: 512px;
}
</style>