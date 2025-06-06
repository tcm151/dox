<script setup lang="ts">
import type { Post, User } from '~~/types'

const route = useRoute()
const userId = route.params.userId as string

const user = await useFetch<User>(`/api/user/${userId}`)
const posts = await useFetch<Post[]>(`/api/user/${userId}/posts`)
</script>


<template>
    <article class="user column g-2 p-4">
        <UserPreview v-if="user.data.value" :user="user.data.value" @refresh="user.refresh" />
        <Feed :items="posts" :sorting="true">
            <template #item="post">
                <PostPreview :post="post" />
            </template>
        </Feed>
    </article>
</template>

<style scoped lang="scss">
article.user {
    @include fit-width(60rem, 1rem);
}
</style>