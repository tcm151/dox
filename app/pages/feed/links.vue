<script setup lang="ts">
import type { Link } from "@@/shared/types"

const links = useFeedDatasource<Link>("/api/link", {
    sorting: true,
})
</script>

<template>
    <section class="content-width feed column g-2 p-4">
        <Feed :items="links">
            <template #buttons>
                <button v-if="useSettings().app.links.enabled" class="dark px-5" @click="navigateTo('/editor/link')">
                    <i class="fa-solid fa-link"></i>
                    <span>Submit</span>
                </button>
            </template>
            <template #item="link">
                <LinkPreview :link="link" />
            </template>
        </Feed>
    </section>
</template>