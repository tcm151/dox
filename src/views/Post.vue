<script setup lang="ts">
import axios from 'axios';
import { useRoute } from 'vue-router';
import { inject, onBeforeMount, ref } from 'vue';
import { store } from '../services/store';
import { sortComments } from '../services/sorting';
import { Post, Comment } from '../api/types';
import Sorter from '../components/utilities/Sorter.vue';
import Details from '../components/posts/Details.vue';
import CommentList from "../components/posts/CommentList.vue"
import Interactions from '../components/posts/Interactions.vue';
import { currentTime } from '../services/dateTime';

const route = useRoute();

onBeforeMount(async () => {
    const postResponse = await axios.get<Post>(`https://doxforeverything.herokuapp.com/posts/${route.params.post_id}`);
    post.value = postResponse.data;

    const commentsResponse = await axios.get<Comment[]>(`https://doxforeverything.herokuapp.com/posts/${route.params.post_id}/comments`)
    comments.value = commentsResponse.data;

    sortBy("top")
})

const toggleModal = inject("toggleModal") as Function;

const post = ref<Post>();
const comments = ref<Comment[]>([]);
const currentSortType = ref<string>("hot");

function sortBy(sortType: string) {
    currentSortType.value = sortType;
    comments.value = sortComments(comments.value, sortType);
}

async function submitComment(params: { comment: string, replyTo: number | null }) {
    const response = await axios.post(
        "https://doxforeverything.herokuapp.com/newComment",
        new URLSearchParams({
            user_id: store.getters.getSession.user.user_id,
            post_id: String(post.value?.post_id),
            reply_to: String(params.replyTo),
            content: params.comment,
        }))

    comments.value.push({
        comment_id: 0,
        user_id: store.getters.getSession.user.user_id,
        user: store.getters.getCurrentUser,
        post_id: Number(post.value?.post_id),
        reply_to: params.replyTo,
        content: params.comment,
        time: currentTime(),
        votes: {
            upvotes: [],
            misleading: [],
            downvotes: [],
        }
    })
}

function getReplies() {
    return comments.value.filter(c => c.reply_to === null || c.reply_to === NaN);
}

</script>


<template>
    <div>
        <div class="post box m-2 p-4">
            <Details :post="post!" />
            <Interactions :post="post" @post-comment="submitComment" />
        </div>
        <div class="community box m-2 p-4">
            <Sorter @sort-by="sortBy" />
            <CommentList :comments="comments" :replies="getReplies()" @submit-comment="submitComment" />
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '../styles/global.scss';

.community {
    @include flex-v;
    gap: 0.5em;
}
</style>