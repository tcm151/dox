<script setup lang="ts">
import type { Link } from "@@/shared/types"

const cache = useCache()

const sortBy = cache.get<string>("feed.sort", () => "new")
const links = useDatasource<Link[]>("/api/link", {
    query: { sortBy },
})
</script>

<template>
    <section class="content-width feed column g-2 p-4">
        <Feed :items="links" :sorting="true" @refresh="(type) => sortBy = type">
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