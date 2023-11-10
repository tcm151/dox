<script setup lang="ts">
const props = defineProps<{
    time: string
}>()
</script>

<template>
    <Tag
        type="info"
        icon="fa-stopwatch"
        :label="formatDate(time)"
    />
</template>

<style scoped lang="scss">
</style>