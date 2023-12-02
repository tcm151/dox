<script setup lang="ts">
const route = useRoute()
const id = route.params.id.toString()
</script>

<template>
    <article class="column p-4">
        <section class="box p-4">
            {{ `thread:${id}` }}
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}
</style>