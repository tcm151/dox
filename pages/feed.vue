<script setup lang="ts">
import { Post } from '~/types/types';

definePageMeta({
    layout: 'default'
})

const { data: allPosts } = await useFetch<Post[]>("/api/posts");

const session = getSession();

const feedPosts = computed(() => allPosts.value?.filter(p => {
    return p.topics.some(pt => session.user?.topics.includes(pt))
        || session.user?.following.includes(p.user.id)
})!)

let filterType = ref("All")
let filteredPosts = ref<Post[] | null>([])

onMounted(() => filteredPosts.value = allPosts.value)

function toggleFilter() {
    switch (filterType.value) {
        case "All":
            filterType.value = "Feed";
            filteredPosts.value = feedPosts.value;
            return;
        case "Feed":
            filterType.value = "All";
            filteredPosts.value = allPosts.value;
            return;
    }
}
</script>

<template>
    <div class="index">
        <Feed :posts="filteredPosts ?? []" :sorting="true" :pagination="true" >
            <template #header>
                <button @click="toggleFilter">{{ filterType }}</button>
            </template>
        </Feed>
    </div>
</template>

<style scoped lang="scss">
.index {
    @include fill-width(800px);
}
</style>