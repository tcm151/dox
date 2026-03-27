<script setup lang="ts">
const props = defineProps<{
    showText?: boolean
}>()
</script>

<template>
    <span class="column inline g-4">
        <i class="fa-solid fa-spinner"></i>
        <p v-if="showText">Loading . . .</p>
    </span>
</template>

<style scoped lang="scss">
span {
    i.fa-spinner {
        color: inherit;
        animation: spin 1s linear infinite;
    }
}
</style>