<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (to.path === "/settings") {
            return navigateTo("/settings/account")
        }
    }
})
</script>

<template>
    <article class="column center-inline">
        <PagedTabstrip
            :tabs="[
                { route: '/settings/account', icon: 'fa-solid fa-address-card', label: 'Account' },
            ]"
        />
        <section class="page column center-inline">
            <NuxtPage />
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    width: 100%;
    overflow-y: hidden;
}

section.page {
    width: 100%;
    overflow-y: auto;
}
</style>