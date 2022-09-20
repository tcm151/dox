<script setup lang="ts">
import axios from 'axios';
import { useRoute } from 'vue-router';
import { onBeforeMount, ref } from 'vue';
import { store } from '../services/store';
import { sortComments } from '../services/sorting';
import { Post, Comment } from '../api/types';
import Sorter from '../components/utilities/Sorter.vue';
import Details from '../components/posts/Details.vue';
import CommentList from "../components/posts/CommentList.vue"
import Interactions from '../components/posts/Interactions.vue';

const route = useRoute();

onBeforeMount(async () => {
    console.log("LOADING POST!")
    const postResponse = await axios.get<Post>(`https://doxforeverything.herokuapp.com/posts/${route.params.post_id}`);
    post.value = postResponse.data;

    const commentsResponse = await axios.get<Comment[]>(`https://doxforeverything.herokuapp.com/posts/${route.params.post_id}/comments`)
    comments.value = commentsResponse.data;

    sortBy("top")
})


const post = ref<Post>();
const comments = ref<Comment[]>([]);
const currentSortType = ref<string>("hot");

function sortBy(sortType: string) {
    currentSortType.value = sortType;
    comments.value = sortComments(comments.value, sortType);
}

async function postComment(comment: string) {
    const response = await axios.post(
        "https://doxforeverything.herokuapp.com/newComment",
        new URLSearchParams({
            user_id: store.getters.getSession.user.user_id,
            post_id: String(post.value?.post_id),
            reply_to: String(post.value?.post_id),
            content: comment,
        }))

    comments.value.push({
        comment_id: 0,
        user_id: store.getters.getSession.user.user_id,
        user: store.getters.getCurrentUser,
        post_id: Number(post.value?.post_id),
        reply_to: Number(post.value?.post_id),
        content: comment,
        time: "",
        votes: {
            upvotes: [],
            misleading: [],
            downvotes: [],
        }
    })
}

</script>


<template>
    <div>
        <div class="post box m-2 p-4">
            <Details :post="post!" />
            <Interactions :post="post" @post-comment="postComment" />
        </div>
        <div class="community box m-2 p-4">
            <Sorter post-filter="N/A" @sort-by="sortBy" />
            <CommentList :comments="comments" />
        </div>
    </div>
</template>

<style scoped>

</style>