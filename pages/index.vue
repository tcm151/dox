<script setup lang="ts">
import { Post } from '~~/types/types';

const { data: posts } = await useFetch<Post[]>("/api/posts");
</script>

<template>
    <Feed class="m-5" :posts="posts ?? []" />
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";
</style>