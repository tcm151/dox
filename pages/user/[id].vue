<script setup lang="ts">
import type { User, Sortable } from '~~/types'

const route = useRoute()
const userId = route.params.id?.toString()
const user = await useFetch<User>(`/api/user/${userId}`)

    
const cache = useCache()
const sortBy = cache.get<string>("feed.sort", () => "new")
const feed = await useFetch<Sortable[]>(`/api/user/${userId}/feed`, {
    query: {
        sortBy: sortBy
    }
})
</script>


<template>
    <article class="user column g-2 p-4">
        <UserPreview v-if="user.data.value" :user="user.data.value" @refresh="user.refresh" />
        <Feed :items="feed" :sorting="true" @refresh="(type) => sortBy = type">
            <template #item="item">
                <MultiPreview :item="item" />
            </template>
        </Feed>
    </article>
</template>

<style scoped lang="scss">
article.user {
    @include fit-width(60rem, 1rem);
}
</style>