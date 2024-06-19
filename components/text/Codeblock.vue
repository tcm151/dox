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
    <div class="codeblock p-4" :class="{ wrap: wrap }" v-html="renderMarkdown(markdown)"></div>
</template>

<style scoped lang="scss">
    div.codeblock {
        background-color: $white-1;
        border-radius: 0.25rem;
    }
    
    div.codeblock:not(.wrap) {
        overflow-x: auto;
    }
</style>