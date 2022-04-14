<template>
    <div class="columns p-2">
        <div class="column">
            <Sorter @sort="sortPosts" />
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
import { onBeforeMount, ref } from 'vue';
import Sorter from '../components/Sorter.vue';
import Sidebar from '../components/Sidebar.vue';
import PostList from '../components/PostList.vue';

const posts = ref<Post[]>([]);

function sortPosts(sortType: string) {
    posts.value.sort((first: Post, second: Post) => {
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
}

onBeforeMount(async () => {
    const response = await axios.get<Post[]>("https://doxforeverything.herokuapp.com/posts")
    posts.value = response.data;
    sortPosts("hot")
})
</script>