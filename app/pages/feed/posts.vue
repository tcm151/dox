<script setup lang="ts">
import type { Post } from '@@/shared/types'

const posts = useFeedDatasource<Post<string[]>>("/api/post", {
    sorting: true,
})
</script>

<template>
    <section class="content-width feed column g-2 p-4">
        <Feed :items="posts">
            <template #buttons>
                <button class="dark px-5" @click="navigateTo('/editor/post')">
                    <i class="fa-solid fa-feather"></i>
                    <span>Submit</span>
                </button>
            </template>
            <template #item="post">
                <PostPreview :post="post" />
            </template>
        </Feed>
    </section>
</template>
