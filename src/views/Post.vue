<script setup lang="ts">
import axios from 'axios';
import { useRoute } from 'vue-router';
import { onBeforeMount, ref } from 'vue';
import { Post, Comment } from '../api/types';
import { store } from '../services/store';
import { sortComments } from '../services/sorting';
import Sorter from '../components/utilities/Sorter.vue';
import Details from '../components/posts/Details.vue';
import Interactions from '../components/posts/Interactions.vue';
import CommentList from "../components/posts/CommentList.vue"

onBeforeMount(async () => {
    console.log("LOADING POST!")
    const postResponse = await axios.get<Post>(`https://doxforeverything.herokuapp.com/posts/${route.params.post_id}`);
    post.value = postResponse.data;

    const commentsResponse = await axios.get<Comment[]>(`https://doxforeverything.herokuapp.com/posts/${route.params.post_id}/comments`)
    comments.value = commentsResponse.data;

    sortBy("top")
})

const route = useRoute();

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
            // users: [],
        }
    })

    // toggleCommentBox();
    comment = "";
}


</script>


<template>
    <div class="box m-2 p-4">
        <Details :post="post!" />
        <Interactions :post="post" @post-comment="postComment" />
    </div>
    <div class="box m-2 p-4">
        <!-- <Sorter @sort-by="sortBy" /> -->
        <CommentList :comments="comments" />
    </div>
</template>

<style scoped>

</style>