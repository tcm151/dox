<script setup lang="ts">
defineProps<{ loading?: boolean }>()
</script>

<template>
    <button :disabled="loading">
        <Spinner v-if="loading" />
        <slot v-else />
    </button>
</template>

<style scoped lang="scss">
@keyframes spin {
    from { transform: rotateZ(0deg) }
    to { transform: rotateZ(360deg) }
}

button {
    transition: all 128ms;
}

i.fa-spinner {
    color: $red;
    animation: spin 1s linear infinite;
}
</style>