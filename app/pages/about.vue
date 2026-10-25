<script setup lang="ts">
const settings = useSettings()
const defaultSummary = "ClassicForum is a self-hosted forum platform for public communities, niche interests, and creators who want control over how their space looks, works, and grows. It brings discussions, topics, searchable feeds, profiles, media, and moderation tools together, with local or remote database deployments."
const summary = computed(() => settings.app.about.summary.trim() || defaultSummary)
</script>

<template>
    <article class="m-4">
        <section class="box px-5 py-3">
            <Markdown class="content" :content="summary" />
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width (60rem, 1rem);
}
</style>