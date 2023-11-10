<script setup lang="ts">
const props = defineProps<{
    topic: string
}>()
</script>

<template>
    <span class="tag topic" @click="navigateTo(`/topic/${extractId(topic)}`)">
        {{ extractId(topic) }}
    </span>
</template>

<style scoped lang="scss">
</style>