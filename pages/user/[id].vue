<script setup lang="ts">
import type { User, Sortable } from '~~/types'

const cache = useCache()
const route = useRoute()

const id = route.params.id?.toString()
await useDatasource(`/api/user/${id}/visit`)
const user = await useDatasource<User>(`/api/user/${id}`)
    
const sortBy = cache.get<string>("feed.sort", () => "new")
const feed = useDatasource<Sortable[]>(`/api/user/${id}/feed`, {
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