<script setup lang="ts">
import type { Thread } from '~/types'

const cache = useCache()

const sortBy = cache.get<string>("feed.sort", () => "new")
const threads = useDatasource<Thread[]>("/api/thread", {
    query: {
        sortBy: sortBy
    }
})
</script>

<template>
    <article class="column g-2 p-4">
        <Feed :items="threads" :sorting="true" @refresh="(type) => sortBy = type">
            <template #buttons>
                <button class="dark px-5" @click="navigateTo('/editor/threads')">
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

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

header.box {
    outline: 2px solid $white-2;

    @media only screen and (max-width: 1000px) {
        button:not(.success) {
            flex: 0.25 1;

            span {
                display: none;
            }
        }
    }
}
</style>