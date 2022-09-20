<script setup lang="ts">
import axios from 'axios';
import { inject, onBeforeMount, ref } from 'vue';
import { Post } from '../api/types';
import { store } from '../services/store';
import { sortPosts } from '../services/sorting';
import { navigateTo } from '../services/router';
import Sorter from '../components/utilities/Sorter.vue';
import Sidebar from '../components/nav/Sidebar.vue';
import PostList from '../components/posts/PostList.vue';

onBeforeMount(async () => {
    try {
        const allPostsResponse = await axios.get<Post[]>("https://doxforeverything.herokuapp.com/posts")
        allPosts.value = allPostsResponse.data;
        allPosts.value = sortPosts(allPosts.value, "hot")

        feedPosts.value = allPosts.value.filter((post) => post.topics.some((topic) => store.state.session.user?.topics.includes(topic)))
        feedPosts.value = sortPosts(feedPosts.value, "hot")

        posts.value = allPosts.value;
    }
    catch (error: any) {
        console.log(error);
        toggleModal("Failed to load posts...", "Server may be in a non-functioning state.")
    }

})

const posts = ref<Post[]>([]);
const allPosts = ref<Post[]>([])
const feedPosts = ref<Post[]>([]);
const currentSortType = ref<string>("");

const toggleModal = inject("toggleModal") as Function;

const postFilter = ref<string>("Popular");

function toggleFilter() {
    switch (postFilter.value) {
        case "Popular":
            postFilter.value = "Feed";
            allPosts.value = posts.value;
            posts.value = feedPosts.value;
            break;
        case "Feed":
            postFilter.value = "Popular";
            feedPosts.value = posts.value;
            posts.value = allPosts.value;
            break;
    }
}

function sortBy(sortType: string) {
    currentSortType.value = sortType;
    posts.value = sortPosts(posts.value, sortType);
}

</script>


<template>
    <div class="columns p-2">
        <div class="column">
            <Sorter :post-filter="postFilter" @toggle-filter="toggleFilter" @sort-by="sortBy"
                    @navigate-to="navigateTo" />
            <PostList :posts="posts" />
        </div>
        <div class="column is-4 pl-0">
            <Sidebar />
        </div>
    </div>
</template>

<style scoped lang="scss">

</style>