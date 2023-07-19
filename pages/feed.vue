<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (to.path === "/feed") {
            return navigateTo("/feed/posts")
        }
    }
})
</script>

<template>
    <article class="column center-inline">
        <PagedTabstrip
            :tabs="[
                { route: '/feed/posts', icon: 'fa-solid fa-newspaper', label: 'Posts' },
                { route: '/feed/images', icon: 'fa-solid fa-image', label: 'Images' },
                { route: '/feed/topics', icon: 'fa-solid fa-tags', label: 'Topics' },
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