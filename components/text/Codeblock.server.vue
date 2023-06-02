<script setup lang="ts">
const props = defineProps<{
    code?: string
    language?: string
    wrap?: boolean
}>()

const markdown = computed(() => {
    return [
        `\`\`\`${props.language ?? ""}`,
        `${props.code}`,
        `\`\`\``,
    ].join("\n")
})
</script>

<template>
    <div class="content" :class="{ wrap: wrap }" v-html="renderMarkdown(markdown)"></div>
</template>

<style scoped lang="scss">

</style>