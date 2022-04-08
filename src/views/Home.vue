<template>
    <div class="columns p-4">
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
import { onBeforeMount, ref } from 'vue';
import { Post } from '../api/types';
import Sidebar from '../components/Sidebar.vue';
import PostList from '../components/PostList.vue';
import Sorter from '../components/Sorter.vue';

const posts = ref<Post[]>([]);

function sortPosts(sortType: string) {
    // console.log(sortType);
    posts.value.sort((first: Post, second: Post) => {
        if (sortType == "new") {
            return (first.time < second.time) ? 1 : -1
        }
        else if (sortType == "top") {
            const firstScore = first.votes.upvotes - first.votes.downvotes - (first.votes.misleading / 2);
            const secondScore = second.votes.upvotes - second.votes.downvotes - (second.votes.misleading / 2);
            return (firstScore < secondScore) ? 1 : -1
        }
        else return 0
    })
}

onBeforeMount(async () => {
    const response = await axios.get<Post[]>("https://doxforeverything.herokuapp.com/posts")
    posts.value = response.data;
    sortPosts("top")
})
</script>