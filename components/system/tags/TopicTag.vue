<script setup lang="ts">
const props = defineProps<{
    topic: string
    disable?: boolean
}>()

function viewTopic(topic: string) {
    if (props.disable) return
    navigateTo(`/topic/${extractId(topic)}`)
}
</script>

<template>
    <Tag
        :fill="10"
        type="topic"
        :label="extractId(topic)"
        @click.stop="viewTopic(topic)"
    />
</template>

<style scoped lang="scss">
</style>