<script setup lang="ts">
import { Post } from '~/types'

definePageMeta({
    layout: 'default'
})

const hints = useHints()
const session = getSession()

let page = ref(1)
let pageSize = ref(25)

const { data: allPosts, refresh, error } = await useAsyncData<Post[]>("feed", () => {
    return $fetch(`/api/post?page=${page.value}&pageSize=${pageSize.value}`)
})

const feedPosts = computed(() => {
    return allPosts.value!.filter(p =>
        p.topics.some(pt => session.user?.topics.includes(pt))
        || session.user?.following.includes(p.user.id)
    )
})

async function goToPage(pageNumber: number) {
    console.log(pageNumber)
    page.value = pageNumber
    await refresh({ dedupe: true })
}

watch(error, (error) => {
    if (error) {
        hints.addError("Failed to load posts.")
        hints.addError(error.message)
    }
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
    <section class="feed p-4">
        <Feed
        :page="page"
        :sorting="true"
        :pagination="true"
        @page="goToPage"
        @refresh="refresh"
        :posts="allPosts ?? []">
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
    @include fit-width(800px, 1rem);
}

.filter-type {
    flex: 1 1;
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