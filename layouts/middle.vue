<script setup lang="ts">
</script>

<template>
    <main class="page column inline">
        <div class="slot">
            <slot />
        </div>
    </main>
</template>

<style scoped lang="scss">
div.slot {
    flex: 1 1;
    display: grid;
    place-items: center;
    width: 100%;
}
</style>