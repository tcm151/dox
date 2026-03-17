<script setup lang="ts">
const props = defineProps<{
    time: string
}>()

const readableDate = computed(() => {
    return props.time.split(".")[0]?.replace("T", " ")
})
</script>

<template>
    <Tag
        type="info"
        icon="fa-stopwatch"
        :label="formatDate(time)"
        :title="readableDate"
    />
</template>