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
        <div class="box mb-2">
            <p class="title">Topics</p>
            <div class="field is-grouped is-grouped-multiline">
                <div class="control" v-for="topic in session.user?.topics">
                    <div class="tags has-addons">
                        <div class="tag">{{ topic }}</div>
                        <div class="tag">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                    </div>

                </div>
                <div class="control">
                    <div class="tags has-addons">
                        <div class="tag"></div>
                        <div class="tag">
                            <i class="fa-solid fa-plus"></i>
                        </div>
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
import { store } from '../services/store';
import { Post, Comment } from '../api/types';
import { ref, computed, onBeforeMount } from 'vue';
import Sorter from "../components/Sorter.vue"
import PostList from '../components/PostList.vue';
import CommentList from '../components/CommentList.vue';
import { sortPosts, sortComments } from '../services/sorting';

const session = computed(() => {
    return store.state.session;
})

const posts = ref<Post[]>([]);
const comments = ref<Comment[]>([]);
const currentSortType = ref<string>("");

onBeforeMount(async () => {
    const postsResponse = await axios.get(`https://doxforeverything.herokuapp.com/users/${session.value.user?.user_id}/posts`)
    posts.value = postsResponse.data;

    const commentsResponse = await axios.get(`https://doxforeverything.herokuapp.com/users/${session.value.user?.user_id}/comments`)
    comments.value = commentsResponse.data;

    sortBy("top")
})

function sortBy(sortType: string) {
    currentSortType.value = sortType;
    posts.value = sortPosts(posts.value, sortType);
}

</script>

<style scoped>
.scrollable {
    max-height: 25em;
    overflow: auto;
}

.is-add:hover {
    background-color: silver;
}
</style>