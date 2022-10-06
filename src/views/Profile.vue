<script setup lang="ts">
import axios from 'axios';
import { useRoute } from 'vue-router';
import { ref, watch, onBeforeMount } from 'vue';
import { Post, User } from '../api/types';
import { sortPosts } from '../services/sorting';
import Sorter from "../components/utilities/Sorter.vue"
import Topics from '../components/profile/Topics.vue';
import PostList from '../components/posts/PostList.vue';
import Information from '../components/profile/Information.vue';

const route = useRoute();


const user = ref<User>();
const posts = ref<Post[]>([]);
const currentSortType = ref<string>("");

onBeforeMount(fetchUserContent)
watch(() => route.params, () => fetchUserContent())

async function fetchUserContent() {
    const userResponse = await axios.get(`https://doxforeverything.herokuapp.com/users/username/${route.params.username}`)
    user.value = userResponse.data;

    const postsResponse = await axios.get(`https://doxforeverything.herokuapp.com/users/${user.value?.user_id}/posts`)
    posts.value = postsResponse.data;
}

function sortUserPosts(sortType: string) {
    currentSortType.value = sortType;
    posts.value = sortPosts(posts.value, sortType);
}

</script>


<template>
    <div class="profile m-2">
        <Information :user="user!" />
        <Topics :user="user!" />
        <div class="user-posts box mb-2 p-4">
            <p class="title mb-2">Posts</p>
            <div class="sorting">
                <Sorter @sort-by="sortUserPosts" />
            </div>
            <PostList :posts="posts" />
        </div>
    </div>
</template>

<style lang="scss">
@import '../styles/global.scss';

.sorting {
    @include flex-h (0.5em);

    >* {
        flex: 1 1 0;
    }
}
</style>