<script setup lang="ts">
const props = defineProps<{
    topic: string
}>()
</script>

<template>
    <Tag
        :fill="10"
        type="topic"
        :label="extractId(topic)"
        @click.stop="navigateTo(`/topic/${extractId(topic)}`)"
    />
</template>

<style scoped lang="scss">
</style>