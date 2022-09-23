<script setup lang="ts">
import axios from 'axios';
import { useRoute } from 'vue-router';
import { ref, computed, onBeforeMount, watch } from 'vue';
import { Post, Comment, User } from '../api/types';
import { store } from '../services/store';
import { sortPosts, sortComments } from '../services/sorting';
import Sorter from "../components/utilities/Sorter.vue"
import PostList from '../components/posts/PostList.vue';
import CommentList from '../components/posts/CommentList.vue';
import Information from '../components/profile/Information.vue';
import Topics from '../components/profile/Topics.vue';

const route = useRoute();

const session = computed(() => {
    return store.state.session;
})

const user = ref<User>();
const posts = ref<Post[]>([]);
const comments = ref<Comment[]>([]);
const currentSortType = ref<string>("");

onBeforeMount(fetchUserContent)
watch(() => route.params, () => fetchUserContent())

async function fetchUserContent() {
    const userResponse = await axios.get(`https://doxforeverything.herokuapp.com/users/username/${route.params.username}`)
    user.value = userResponse.data;

    const postsResponse = await axios.get(`https://doxforeverything.herokuapp.com/users/${user.value?.user_id}/posts`)
    posts.value = postsResponse.data;

    const commentsResponse = await axios.get(`https://doxforeverything.herokuapp.com/users/${user.value?.user_id}/comments`)
    comments.value = commentsResponse.data;

    // sortBy("top")
}

// function sortBy(sortType: string) {
//     currentSortType.value = sortType;
//     posts.value = sortPosts(posts.value, sortType);
// }

</script>


<template>
    <div class="profile m-2">
        <Information :user="user!" />
        <Topics :user="user!" />
        <div class="user-posts box mb-2 p-4">
            <div class="header">
                <p class="title my-0">Posts</p>
                <Sorter @sort-by="sortPosts" />
            </div>
            <PostList :posts="posts" />
        </div>
        <div class="box">
            <div class="header">
                <p class="title my-0">Comments</p>
                <Sorter @sort-by="sortComments" />
            </div>
            <CommentList :comments="comments" :replies="[]" />
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '../styles/global.scss';

.header {
    @include flex-h;
    align-items: center;
    gap: 1em;
}
</style>