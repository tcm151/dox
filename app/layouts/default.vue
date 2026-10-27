<script setup lang="ts">
</script>

<template>
    <main class="page column inline">
        <slot />
        <footer class="content-width row inline between px-6 m-5">
                <div class="links column g-1">
                    <NuxtLink to="/about">About</NuxtLink>
                    <NuxtLink to="/contact">Contact</NuxtLink>
                </div>
                <img class="icon" src="/images/surrealdb-icon.png">
        </footer>
    </main>
</template>

<style scoped lang="scss">
main.page {
    overflow-anchor: none;
}

footer.row {
    order: 9999;

    .links {
        font-weight: var(--fw-bold);

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