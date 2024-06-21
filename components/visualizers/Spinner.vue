<script setup lang="ts">
const props = defineProps<{
    fontSize?: string
    showText?: boolean
}>()

let size = props.fontSize ?? "1rem"
</script>

<template>
    <span class="column center-inline g-4">
        <i class="fa-solid fa-spinner"></i>
        <p v-if="showText">Loading . . .</p>
    </span>
</template>

<style scoped lang="scss">

@keyframes spin {
    from { transform: rotateZ(0deg) }
    to { transform: rotateZ(360deg) }
}

span {
    i.fa-spinner {
        color: inherit;
        font-size: v-bind('size');
        animation: spin 1s linear infinite;
    }
}
</style>