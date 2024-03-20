<script setup lang="ts">
defineProps<{
    fontSize: string
    showLoadingText: boolean
}>()
</script>

<template>
    <div class="spinner column center-inline g-4">
        <i class="fa-solid fa-spinner"></i>
        <p v-if="showLoadingText">Loading . . .</p>
    </div>
</template>

<style scoped lang="scss">

@keyframes spin {
    from {
        transform: rotateZ(0deg);
    }
    to {
        transform: rotateZ(360deg);
    }
}

.spinner {
    i {
        color: $blue;
        font-size: v-bind('fontSize');
        animation: spin 1s linear infinite;
    }
}
</style>