<script setup lang="ts">
</script>

<template>
    <main class="page column center-inline">
        <div class="slot">
            <slot />
        </div>
        <footer class="row center-inline px-5 m-5">
            <div class="links">
                <NuxtLink to="/home">Home</NuxtLink>
                <NuxtLink to="/about">About</NuxtLink>
                <NuxtLink to="/contact">Contact</NuxtLink>
            </div>
            <img class="icon" src="/images/surrealdb-icon.png">
        </footer>
    </main>
</template>

<style scoped lang="scss">
.slot {
    flex: 1 1;
    @include fit-width (100%, 1rem);
    display: grid;
    place-items: center;
}

footer.row {
    @include fit-width (800px, 1rem);
    justify-content: space-between;

    .links {
        @include flex-v (0.25rem);
        font-weight: 700;
    }

    .links:hover {
        color: #777;
    }

    .icon {
        flex: 0 1;
        height: 2rem;
        object-fit: contain;
        filter: grayscale(100%);
    }
}
</style>