<script setup lang="ts">
const settings = useSettings()

const props = defineProps<{
    topic: string
    disable?: boolean
}>()

function viewTopic(topic: string) {
    if (!props.disable) {
        return navigateTo(`/topic/${extractId(topic)}`)
    }
}
</script>

<template>
    <Tag
        type="topic"
        class="f-max"
        :label="extractId(topic)"
        @click.stop="viewTopic(topic)"
    />
</template>