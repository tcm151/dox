<template>
    <div v-if="session.authenticated">
        <div class="level box my-2 p-4 is-mobile">
            <div class="level-left">
                <div class="level-item">
                    <figure class="image is-96x96">
                        <img src="https://bulma.io/images/placeholders/96x96.png">
                    </figure>
                </div>
                <div class="level-item">
                    <div>
                        <p class="title my-2">{{ session.user?.username }}</p>
                        <p>{{ session.user?.email }}</p>
                    </div>
                </div>

            </div>
        </div>
        <div class="box my-2 p-4">
            <p class="title">Posts</p>
            <div class="scrollable p-2">
                <Sorter @sort="sortPosts" />
                <PostList :posts="posts" />
            </div>
        </div>
        <div class="box my-2">
            <p class="title">Comments</p>
            <div class="scrollable p-2">
                <Sorter @sort="sortComments" />
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
import { DateTime } from 'luxon';
import { store } from '../services/store';
import { Post, Comment } from '../api/types';
import { ref, computed, onBeforeMount } from 'vue';
import Sorter from "../components/Sorter.vue"
import PostList from '../components/PostList.vue';
import CommentList from '../components/CommentList.vue';

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

function sortComments() {

}

</script>

<style scoped>
.scrollable {
    max-height: 25em;
    overflow: auto;
}
</style>