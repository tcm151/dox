<script setup lang="ts">
import axios from 'axios';
import { useRoute } from 'vue-router';
import { inject, onBeforeMount, ref } from 'vue';
import { sortComments } from '../services/sorting';
import { Post, Comment } from '../api/types';
import Sorter from '../components/utilities/Sorter.vue';
import Details from '../components/posts/Details.vue';
import CommentList from "../components/posts/CommentList.vue"
import Interactions from '../components/posts/Interactions.vue';
import { currentTime } from '../services/dateTime';
import { GetSession } from '../services/store.new';

const route = useRoute();

const session = GetSession();

onBeforeMount(async () => {
    const postResponse = await axios.get<Post>(`https://www.tcmdev.ca/dox/posts/${route.params.post_id}`);
    post.value = postResponse.data;

    const commentsResponse = await axios.get<Comment[]>(`https://www.tcmdev.ca/dox/posts/${route.params.post_id}/comments`)
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
        "https://www.tcmdev.ca/dox/newComment",
        new URLSearchParams({
            user_id: String(session.User?.user_id),
            post_id: String(post.value?.post_id),
            reply_to: String(params.replyTo),
            content: params.comment,
        })
    )

    if (response.status !== 201) {
        toggleModal("Unable to post comment", "please try again in a few moments, the servers may be overloaded...")
        return;
    }

    comments.value.push({
        comment_id: response.data.comment_id,
        user_id: session.User!.user_id,
        user: session.User!,
        post_id: Number(post.value?.post_id),
        reply_to: params.replyTo,
        content: params.comment,
        time: currentTime(),
        votes: {
            upvotes: [session.User!.user_id],
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
    <div class="post">
        <div class="box m-2 p-4">
            <Details :post="post!" />
            <Interactions :post="post" @post-comment="submitComment" />
        </div>
        <div class="community box m-2 p-4">
            <div class="sorting">
                <Sorter @sort-by="sortBy" />
            </div>
            <CommentList :comments="comments" :replies="getReplies()" @submit-comment="submitComment" />
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '../styles/global.scss';

.community {
    @include flex-v;
    gap: 0.5em;

    .sorting {
        @include flex-h (0.5em);
    }
}
</style>