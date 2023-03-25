<script setup lang="ts">
import { Post } from '~/types'

definePageMeta({
    layout: 'default'
})

const session = getSession();

const { data: allPosts } = await useFetch<Post[]>("/api/posts");

const feedPosts = computed(() => {
    return allPosts.value!.filter(p =>
        p.topics.some(pt => session.user?.topics.includes(pt))
        || session.user?.following.includes(p.user.id)
    )
})

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
    <section class="feed p-2">
        <Feed :posts="filteredPosts ?? []" :sorting="true" :pagination="true" >
            <template #header>
                <button class="filter-type" @click="toggleFilter">
                    <i class="fa-solid fa-globe"></i>
                    <span>{{ filterType }}</span>
                </button>
            </template>
        </Feed>
    </section>
</template>

<style scoped lang="scss">
.feed {
    @include fill-width(800px, 0rem);
}

.filter-type {
    flex: 0 1 128px;
    @include flex-h (0.5rem);
    justify-content: center;
    align-items: center;
    color: $dox-white;
    background-color: $dox-black;
}

.filter-type:hover {
    background-color: $dox-grey-dark;
}
</style>