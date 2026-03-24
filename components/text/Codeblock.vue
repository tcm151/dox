<script setup lang="ts">
const props = defineProps<{
    code?: string
    language?: string
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
    <div class="codeblock p-4" v-html="renderMarkdown(markdown)"></div>
</template>

<style scoped lang="scss">
    div.codeblock {
        background-color: $white-1;
        border-radius: 0.25rem;
        overflow-x: auto;
    }
    
    div.codeblock:not(.wrap) {
        overflow-x: auto;
    }
</style>