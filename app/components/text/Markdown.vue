<script setup lang="ts">
defineProps<{ content?: string }>()
</script>

<template>
    <div class="markdown" v-html="renderMarkdown(content)"></div>
</template>

<style lang="scss">
div.markdown:not(.content) {
    p:not(:first-child) {
        margin-top: 0.5rem;
    }

    p:not(:last-child) {
        margin-bottom: 0.5rem;
    }
}

.wrap {
    pre:has(code) {
        code {
            overflow-x: hidden;
            white-space: break-spaces;
        }
    }
}
</style>