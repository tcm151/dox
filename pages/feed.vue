<script setup lang="ts">
const { data: posts } = await useFetch("/api/posts");
</script>

<template>
    <div class="index">
        <Feed :posts="posts ?? []" :sorting="true" :pagination="true" />
    </div>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";

.index {
    @include fill-width(800px);
}
</style>