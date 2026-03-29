<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (!ENV.isClient()) return
            
        const cache = useCache()
        const lastTab = cache.get("editor.lastTab", () => "posts")
        if (to.path === "/editor") {
            return navigateTo(`/editor/${lastTab.value}`)
        }
        else {
            lastTab.value = to.path.split("/").at(-1)!
        }
    }
})

const route = useRoute()

const tabs = ref<any[]>([
    { route: '/editor/posts', icon: 'fa-feather', label: 'Post' },
    { route: '/editor/threads', icon: 'fa-message', label: 'Thread' },
])
</script>

<template>
    <article class="editor column inline">
        <ClientOnly>
            <PagedTabstrip :tabs="tabs" />
        </ClientOnly>
        <section class="page column inline">
            <NuxtPage :key="route.path" />
        </section>
    </article>
</template>

<style scoped lang="scss">
article.editor {
    width: stretch;
    overflow-y: hidden;
}

section.page {
    width: stretch;
    height: stretch;
    overflow-y: auto;
}
</style>