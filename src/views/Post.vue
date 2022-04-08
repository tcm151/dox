<template>
    <div class="box m-5 has-background-light">
        <div class="block content">
            <h2 class="mb-1">{{ post?.title }}</h2>
            <div class="is-flex is-flex-direction-row">
                <p class="has-text-primary">{{ post?.votes.upvotes }}</p>
                <p class="has-text-warning px-4">{{ post?.votes.misleading }}</p>
                <p class="has-text-danger pr-4">{{ post?.votes.downvotes }}</p>
                <p>{{ post?.time }}</p>
                <p>{{ post?.user?.username }}</p>
            </div>
            <div class="block">
                <p>{{ post?.content }}</p>
            </div>
        </div>
        <div class="block">
            <button class="button is-primary" @click="toggleCommentBox">Comment</button>
            <div v-if="showCommentBox">
                <textarea cols="30" rows="10" v-model="comment"></textarea>
                <button class="button" @click="postComment">Submit</button>
            </div>
        </div>
    </div>
    <CommentList :comments="comments" />
</template>

<script setup lang="ts">
import axios from 'axios';
import { useRoute } from 'vue-router';
import { onBeforeMount, ref } from 'vue';
import { store } from '../services/store';
import { Post, Comment } from '../api/types';
import CommentList from "../components/CommentList.vue"

const route = useRoute();

const post = ref<Post>();
const comments = ref<Comment[]>([]);

const comment = ref("");
const showCommentBox = ref(false);

function toggleCommentBox() {
    showCommentBox.value = !showCommentBox.value;
}

async function postComment() {
    const response = await axios.post(
        "https://doxforeverything.herokuapp.com/newComment",
        new URLSearchParams({
            user_id: store.getters.getSession.user.user_id,
            post_id: String(post.value?.post_id),
            reply_to: String(post.value?.post_id),
            content: comment.value,
        }))

    comments.value.push({
        comment_id: 0,
        user_id: store.getters.getSession.user.user_id,
        user: store.getters.getCurrentUser,
        post_id: Number(post.value?.post_id),
        reply_to: Number(post.value?.post_id),
        content: comment.value,
        time: "",
        votes: {
            upvotes: 1,
            misleading: 0,
            downvotes: 0,
            users: [],
        }
    })

    toggleCommentBox();
    comment.value = "";

    // console.log(response);
}

onBeforeMount(async () => {
    const postResponse = await axios.get<Post>(`https://doxforeverything.herokuapp.com/posts/${route.params.post_id}`);
    post.value = postResponse.data;

    const commentsResponse = await axios.get<Comment[]>(`https://doxforeverything.herokuapp.com/posts/${route.params.post_id}/comments`)
    comments.value = commentsResponse.data;

    console.log(comments.value);
})

</script>