<script setup lang="ts">
import type { User, Sortable } from '~~/types'

const cache = useCache()
const route = useRoute()

const id = route.params.id?.toString()
const user = await useDatasource<User>(`/api/user/${id}`)

    
const sortBy = cache.get<string>("feed.sort", () => "new")
const feed = useDatasource<Sortable[]>(`/api/user/${id}/feed`, {
    query: {
        sortBy: sortBy
    }
})
</script>


<template>
    <article class="user column g-2 p-4 fit-large">
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
}
</style>