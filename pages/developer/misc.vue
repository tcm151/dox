<script setup lang="ts">

async function something() {
    const response = await $fetch("/api/yooo")
    console.log(response)
}

</script>

<template>
    <article class="p-4">
        <button @click="something">
            Click!
        </button>
    </article>
</template>

<style scoped lang="scss">
</style>