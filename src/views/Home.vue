<template>
    <div class="columns p-4 has-background-light">
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
import moment from 'moment';
import { Post } from '../api/types';
import { onBeforeMount, ref } from 'vue';
import Sorter from '../components/Sorter.vue';
import Sidebar from '../components/Sidebar.vue';
import PostList from '../components/PostList.vue';

const posts = ref<Post[]>([]);

function sortPosts(sortType: string) {
    posts.value.sort((first: Post, second: Post) => {
        if (sortType == "new") {
            const firstTime = moment(first.time)
            const secondTime = moment(second.time)
            return (firstTime < secondTime) ? 1 : -1
        }
        else if (sortType == "top") {
            const firstScore = first.votes.upvotes - first.votes.downvotes - (first.votes.misleading / 2);
            const secondScore = second.votes.upvotes - second.votes.downvotes - (second.votes.misleading / 2);
            return (firstScore < secondScore) ? 1 : -1
        }
        else if (sortType == "hot") {
            const timeSinceFirst = moment().diff(first.time, 'days')
            const timeSinceSecond = moment().diff(second.time, 'days')
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