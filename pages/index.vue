<script setup lang="ts">
const { data: posts } = await useFetch("/api/posts");
</script>

<template>
    <Feed class="m-5" :posts="posts ?? []" />
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";
</style>