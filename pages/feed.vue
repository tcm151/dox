<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        const cache = useCache()
        const lastTab = cache.get("feed.lastTab", () => "posts")
        if (to.path === "/feed") {
            return navigateTo(`/feed/${lastTab.value}`)
        }
        else {
            lastTab.value = to.path.split("/").at(-1)!
        }
    }
})
</script>

<template>
    <article class="column center-inline">
        <PagedTabstrip
            :tabs="[
                { route: '/feed/topics', icon: 'fa-solid fa-tags', label: 'Topics' },
                { route: '/feed/posts', icon: 'fa-solid fa-newspaper', label: 'Posts' },
                { route: '/feed/threads', icon: 'fa-solid fa-comments', label: 'Threads' },
                { route: '/feed/images', icon: 'fa-solid fa-image', label: 'Images' },
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