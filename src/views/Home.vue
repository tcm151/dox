<template>
    <div class="columns p-2">
        <div class="column">
            <div class="level-left">
                <button @click.prevent="toggleFilter" class="level-item button is-primary has-text-weight-bold">
                    {{ postFilter }}
                </button>
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
const postFilter = ref<string>("All");

function toggleFilter() {
    switch (postFilter.value) {
        case "All":
            postFilter.value = "Feed";
            allPosts.value = posts.value;
            posts.value = feedPosts.value;
            break;
        case "Feed":
            postFilter.value = "All";
            feedPosts.value = posts.value;
            posts.value = allPosts.value;
            break;
    }
}

function sortBy(sortType: string) {
    currentSortType.value = sortType;
    posts.value = sortPosts(posts.value, sortType);
}

function sortPosts(postList: Post[], sortType: string): Post[] {
    postList.sort((first: Post, second: Post) => {
        if (sortType == "new") {
            const firstTime = DateTime.fromISO(first.time)
            const secondTime = DateTime.fromISO(second.time)
            return (firstTime < secondTime) ? 1 : -1
        }
        else if (sortType == "top") {
            const firstScore = first.votes.upvotes - first.votes.downvotes - (first.votes.misleading / 2);
            const secondScore = second.votes.upvotes - second.votes.downvotes - (second.votes.misleading / 2);
            return (firstScore < secondScore) ? 1 : -1
        }
        else if (sortType == "hot") {
            const timeSinceFirst = DateTime.now().diff(DateTime.fromISO(first.time), 'days').days
            const timeSinceSecond = DateTime.now().diff(DateTime.fromISO(second.time), 'days').days
            const firstScore = (first.votes.upvotes - first.votes.downvotes - (first.votes.misleading / 2)) / (timeSinceFirst + 1);
            const secondScore = (second.votes.upvotes - second.votes.downvotes - (second.votes.misleading / 2)) / (timeSinceSecond + 1);
            return (firstScore < secondScore) ? 1 : -1
        }
        else return 0
    })
    return postList;
}

</script>

<style scoped>
.button {
    border: 1px solid grey;
    width: 5em;
}
</style>