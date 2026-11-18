<script setup lang="ts">
import type { User, Sortable } from '@@/shared/types'

const route = useRoute()

const id = route.params.id?.toString()
await useDatasource(`/api/user/${id}/visit`)

const user = await useDatasource<User>(`/api/user/${id}`, {
    key: `user:${id}`,
})

const feed = useFeedDatasource<Sortable>(`/api/user/${id}/feed`, {
    sorting: true,
})
</script>


<template>
    <article class="content-width column g-2 p-4">
        <UserPreview v-if="user.data.value" :user="user.data.value" @refresh="user.refresh" />
        <Feed :items="feed">
            <template #item="item">
                <MultiPreview :item="item" />
            </template>
        </Feed>
    </article>
</template>
