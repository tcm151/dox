<script setup lang="ts">
definePageMeta({
    layout: 'simple'
})
</script>

<template>
    <article class="column m-4">
        <!-- TODO scaffold store page -->
        <section class="column p-4">
            <button class="danger">
                <i class="fa-solid fa-person-digging"></i>
                This page is still under construction...
            </button>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(400px, 1rem);
}

section {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}
</style>