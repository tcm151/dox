<script setup lang="ts">
defineProps<{ content?: string }>()
</script>

<template>
    <div class="content" v-html="renderMarkdown(content)"></div>
</template>