<script setup lang="ts">
import type { Thread } from '@@/shared/types'

const threads = useFeedDatasource<Thread>("/api/thread", {
    sorting: true,
})
</script>

<template>
    <article class="content-width column g-2 p-4">
        <Feed :items="threads">
            <template #buttons>
                <button class="dark px-5" @click="navigateTo('/editor/thread')">
                    <i class="fa-solid fa-feather"></i>
                    <span>Submit</span>
                </button>
            </template>
            <template #item="thread">
                <ThreadPreview :thread="thread" />
            </template>
        </Feed>
    </article>
</template>