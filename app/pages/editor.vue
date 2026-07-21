<script setup lang="ts">
const route = useRoute()

definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (!ENV.isClient()) return

        const tabs = useLastTab({ base: "editor", default: "posts" })
        if (to.path === "/editor") {
            return navigateTo(tabs.getLastTab())
        }
        else {
            tabs.setLastTab(to.path)
        }
    }
})

const tabs = ref<TabItem[]>([
    { route: '/editor/post', icon: 'fa-feather', label: 'Post' },
    { route: '/editor/thread', icon: 'fa-message', label: 'Thread' },
    // { route: '/editor/link', icon: 'fa-link', label: 'Link' },
    // { route: '/editor/album', icon: 'fa-images', label: 'Album' },
    // { route: '/editor/audio', icon: 'fa-music', label: 'Audio' },
    // { route: '/editor/poll', icon: 'fa-list', label: 'Poll' },
])

// REFACTOR consolidate unfinished editor variant actions (drafts/upload/preview) behind shared placeholder components.
</script>

<template>
    <article class="editor column inline">
        <PagedTabstrip :tabs="tabs" />
        <section class="page column inline">
            <NuxtPage :key="route.path" />
        </section>
    </article>
</template>

<style scoped lang="scss">
article.editor {
    width: stretch;
    height: 100%;
    min-height: 0;
    overflow: hidden;
}

section.page {
    flex: 1 1 auto;
    width: stretch;
    min-height: 0;
    overflow: hidden;
}
</style>