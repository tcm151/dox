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

// TODO allow scheduling of posts and threads with future publish dates
// TODO add support for polls with multiple options and expiration dates, and display results in real-time on the post or thread.
// TODO allow support for linking to external articles or videos with rich embeds and previews in addition to image uploads.
// TODO add common keyboard shortcuts for the editor
// TODO add side-by-side markdown preview, cannot parse on every keychange so need a debounce strategy to balance responsiveness and performance.
// TODO add series/collection support for grouping related posts and threads together, with a dedicated page for each series/collection and visual indicators on included posts and threads.
// TODO editing a post or thread should create a revision history that moderators can view and revert to previous versions
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