<script setup lang="ts">
const props = defineProps<{
    topic: string
}>()
</script>

<template>
    <Tag
        type="topic"
        :label="extractId(topic)"
        @click.stop="navigateTo(`/topic/${extractId(topic)}`)"
    />
</template>

<style scoped lang="scss">
span.tag.topic {
    flex: 10 1 2rem;
}
</style>