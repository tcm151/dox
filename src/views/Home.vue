<template>
    <div class="columns p-2">
        <div class="column">
            <div class="level-left">
                <div class="level-left mr-3">
                    <button class="level-item button is-link has-text-weight-bold"
                        @click.prevent="navigateTo('/editor')">
                        <span class="icon">
                            <i class="fa-solid fa-feather-pointed"></i>
                        </span>
                        <span>Post</span>
                    </button>
                    <button @click.prevent="toggleFilter" class="level-item button is-primary has-text-weight-bold">
                        {{ postFilter }}
                    </button>
                </div>
                <Sorter class="level-item" @sort="sortBy" />
            </div>
            <PostList :posts="posts" />
        </div>
        <div class="column is-4">
            <Sidebar />
        </div>
    </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { DateTime } from "luxon";
import { Post } from '../api/types';
import { store } from '../services/store';
import { inject, onBeforeMount, ref } from 'vue';
import Sorter from '../components/Sorter.vue';
import Sidebar from '../components/Sidebar.vue';
import PostList from '../components/PostList.vue';
import { sortPosts } from '../services/sorting';
import { router } from '../services/router';

// const session = computed(() => store.state.session)

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

// const filters = ["All", "Feed"]
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

function navigateTo(route: string) {
    // showMenu.value = false;
    router.push(route);
}

</script>

<style scoped>
.button {
    border: 1px solid grey;
    width: 6em;
}
</style>