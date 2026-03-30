<script setup lang="ts">
</script>

<template>
    <main class="page column inline">
        <slot />
        <footer class="row inline between px-6 m-5">
                <div class="links column g-1">
                    <NuxtLink to="/about">About</NuxtLink>
                    <NuxtLink to="/contact">Contact</NuxtLink>
                </div>
                <img class="icon" src="/images/surrealdb-icon.png">
        </footer>
    </main>
</template>

<style scoped lang="scss">
footer.row {
    @include fit-width (60rem, 1rem);
    order: 9999;

    .links {
        font-weight: 700;

        a:hover {
            color: #777;
        }
    }

    .icon {
        flex: 0 1;
        height: 2rem;
        object-fit: contain;
        filter: grayscale(100%);
    }
}
</style>