<script setup lang="ts">
const props = defineProps<{
    time: string
}>()
</script>

<template>
    <span class="tag info">
        <i class="fa-solid fa-stopwatch"></i>
        <span>{{ formatDate(time) }}</span>
    </span>
</template>

<style scoped lang="scss">
</style>