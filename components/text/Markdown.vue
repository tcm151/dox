<script setup lang="ts">
defineProps<{ content?: string }>()
</script>

<template>
    <!-- TODO try to find alternative to passing props -->
    <!-- issue when content is very large, receive error request-uri it too large -->
    <div v-html="renderMarkdown(content)"></div>
</template>