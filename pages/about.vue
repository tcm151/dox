<script setup lang="ts">
const settings = useSettings()
</script>

<template>
    <article class="m-4 fit-large">
        <section class="box px-5 py-3">
            <template v-if="settings.app.about">
                <Markdown class="content" :content="settings.app.about.summary" />
            </template>
            <div v-else class="column center">
                The about section has not been configured yet.
            </div>
        </section>
    </article>
</template>