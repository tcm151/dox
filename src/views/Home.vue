<script setup lang="ts">
import axios from 'axios';
import { Post } from '../api/types';
import { store } from '../services/store';
import { router } from '../services/router';
import { sortPosts } from '../services/sorting';
import Sidebar from '../components/nav/Sidebar.vue';
import PostList from '../components/posts/PostList.vue';
import { inject, onBeforeMount, ref } from 'vue';

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

function navigateTo(route: string) {
    router.push(route);
}
</script>


<template>
    <div class="columns p-2">
        <div class="column">
            <div class="level mb-2 is-hidden-mobile">
                <div class="level-left">
                    <div class="level-item button is-primary has-text-weight-bold" @click.prevent="toggleFilter">
                        {{ postFilter }}
                    </div>
                    <div class="level-item button has-text-weight-semibold" @click.prevent="sortBy('hot')">
                        <div class="icon-text">
                            <span class="icon">
                                <i class="fa-solid fa-fire"></i>
                            </span>
                            <span>Hot</span>
                        </div>
                    </div>
                    <div class="level-item button has-text-weight-semibold" @click.prevent="sortBy('top')">
                        <div class="icon-text">
                            <span class="icon">
                                <i class="fa-solid fa-arrow-up"></i>
                            </span>
                            <span>Top</span>
                        </div>
                    </div>
                    <div class="level-item button has-text-weight-semibold" @click.prevent="sortBy('new')">
                        <div class="icon-text">
                            <span class="icon">
                                <i class="fa-solid fa-egg"></i>
                            </span>
                            <span>New</span>
                        </div>
                    </div>
                    <div class="level-item button is-link has-text-weight-bold" @click.prevent="navigateTo('/editor')">
                        <span class="icon">
                            <i class="fa-solid fa-feather-pointed"></i>
                        </span>
                        <span>Post</span>
                    </div>
                </div>
            </div>
            <div class="level mb-2 is-mobile is-hidden-tablet">
                <div class="level-item button filter is-primary has-text-weight-bold" @click.prevent="toggleFilter">
                    {{ postFilter }}
                </div>
                <div class="level-item button has-text-weight-semibold" @click.prevent="sortBy('hot')">
                    <div class="icon-text">
                        <span class="icon">
                            <i class="fa-solid fa-fire"></i>
                        </span>
                        <!-- <span>Hot</span> -->
                    </div>
                </div>
                <div class="level-item button has-text-weight-semibold" @click.prevent="sortBy('top')">
                    <div class="icon-text">
                        <span class="icon">
                            <i class="fa-solid fa-arrow-up"></i>
                        </span>
                        <!-- <span>Top</span> -->
                    </div>
                </div>
                <div class="level-item button has-text-weight-semibold" @click.prevent="sortBy('new')">
                    <div class="icon-text">
                        <span class="icon">
                            <i class="fa-solid fa-egg"></i>
                        </span>
                        <!-- <span>New</span> -->
                    </div>
                </div>
                <div class="level-item button is-link has-text-weight-bold" @click.prevent="navigateTo('/editor')">
                    <span class="icon">
                        <i class="fa-solid fa-feather-pointed"></i>
                    </span>
                    <!-- <span>Post</span> -->
                </div>
            </div>
            <PostList :posts="posts" />
        </div>
        <div class="column is-4">
            <Sidebar />
        </div>
    </div>
</template>

<style scoped>
.button {
    border: 1px solid grey;
}

.filter {
    width: 6em;
}
</style>