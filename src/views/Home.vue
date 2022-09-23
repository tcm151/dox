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
    <div class="home p-2">
        <div class="posts">
            <div class="toolbar">
                <div class="button is-primary has-text-weight-bold is-hidden-mobile"
                     @click.prevent="$emit('toggleFilter')">
                    <span class="icon">
                        <i class="fa-solid fa-crown"></i>
                    </span>
                    <span>{{ postFilter }}</span>

                </div>
                <div class="button is-primary has-text-weight-bold is-hidden-tablet"
                     @click.prevent="$emit('toggleFilter')">
                    <i class="fa-solid fa-crown"></i>
                </div>
                <Sorter @sort-by="sortBy" />
                <div class="button is-link has-text-weight-bold is-hidden-mobile"
                     @click.prevent="$emit('navigateTo', '/editor')">
                    <span class="icon">
                        <i class="fa-solid fa-feather-pointed"></i>
                    </span>
                    <span>Post</span>
                </div>
                <div class="button is-link has-text-weight-bold is-hidden-tablet"
                     @click.prevent="$emit('navigateTo', '/editor')">
                    <i class="fa-solid fa-feather-pointed"></i>
                </div>
            </div>
            <PostList :posts="posts" />
        </div>
        <div class="sidebar">
            <Sidebar />
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '../styles/global.scss';

.home {
    @include flex-hw (0.5em);

    .posts {
        flex: 8 1 400px;
    }

    .sidebar {
        flex: 1 1 250px;
    }
}

.toolbar {
    @include flex-hw;
    gap: 0.5em;

    div {
        flex: 1 1 0;
    }
}
</style>