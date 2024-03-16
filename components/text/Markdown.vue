<script setup lang="ts">
defineProps<{ content?: string }>()
</script>

<template>
    <!-- CONFLICT try to find alternative to passing props -->
    <!-- issue when content is very large, receive error request-uri it too large -->
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
</style>