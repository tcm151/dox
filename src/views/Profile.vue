<template>
    <div v-if="session.authenticated">
        <div class="box my-5">
            <p class="title">{{ session.user?.username }}</p>
            <p>{{ session.user?.email }}</p>
        </div>
        <div class="box my-5">
            <p class="title">Posts</p>
            <div class="scrollable">
                <Sorter @sort="sortPosts" />
                <PostList :posts="posts" />
            </div>
        </div>
        <div class="box my-5">
            <p class="title">Comments</p>
            <div class="scrollable">
                <CommentList :comments="comments" />
            </div>
        </div>
    </div>
    <div class="box m-5" v-else>
        <p>Not logged in.</p>
    </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { store } from '../services/store';
import { Post, Comment } from '../api/types';
import { ref, computed, onBeforeMount } from 'vue';
import PostList from '../components/PostList.vue';
import CommentList from '../components/CommentList.vue';
import moment from 'moment';

const session = computed(() => {
    return store.state.session;
})

const posts = ref<Post[]>([]);
const comments = ref<Comment[]>([]);

onBeforeMount(async () => {
    const postsResponse = await axios.get(`https://doxforeverything.herokuapp.com/users/${session.value.user?.user_id}/posts`)
    posts.value = postsResponse.data;

    const commentsResponse = await axios.get(`https://doxforeverything.herokuapp.com/users/${session.value.user?.user_id}/comments`)
    comments.value = commentsResponse.data;

    sortPosts("top")
})

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

</script>

<style scoped>
.scrollable {
    max-height: 25em;
    overflow: auto;
}
</style>