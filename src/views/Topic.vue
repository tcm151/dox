<script setup lang="ts">
import axios from 'axios';
import { computed, inject, onBeforeMount, ref, watch, getCurrentInstance } from 'vue';
import { useRoute } from 'vue-router';
import { Post, User } from '../api/types';
import { store } from '../services/store';
import Sorter from '../components/utilities/Sorter.vue';
import PostList from '../components/posts/PostList.vue';

const session = computed(() => {
    return store.state.session;
})

const route = useRoute();
const topicPosts = ref<Post[]>([])

const toggleModal = inject("toggleModal") as Function;

onBeforeMount(fetchPosts)
watch(() => route.params, () => fetchPosts())

async function fetchPosts() {
    try {
        const topicPostsResponse = await axios.get<Post[]>(`https://doxforeverything.herokuapp.com/posts/topic/${route.params.topic}`)
        topicPosts.value = topicPostsResponse.data;
    }
    catch (error: any) {
        console.log(error);
        toggleModal("Failed to load posts...", "Server may be in a non-functioning state.")
    }
}

async function followTopic(topic: string) {
    session.value.user?.topics.push(topic);
    axios.patch(
        `https://doxforeverything.herokuapp.com/users/${session.value.user?.user_id}/topics`,
        new URLSearchParams({
            topics: JSON.stringify(session.value.user?.topics)
        }))
    store.commit('updateTopics', session.value.user?.topics);
}

async function unfollowTopic(topic: string) {
    session.value.user!.topics = session.value.user?.topics.filter(t => t !== topic)!;
    axios.patch(
        `https://doxforeverything.herokuapp.com/users/${session.value.user?.user_id}/topics`,
        new URLSearchParams({
            topics: JSON.stringify(session.value.user?.topics)
        }))
    store.commit('updateTopics', session.value.user?.topics);
}

function followingTopic(topic: string) {
    return (session.value.user?.topics.includes(topic))
}

function sortBy(sortType: string) {

}

</script>

<template>
    <div class="topic-page m-2">
        <div class="topic-header box mb-2 py-3">
            <p class="title my-0">{{ route.params.topic }}</p>
            <Sorter @sort-by="sortBy" />
            <div class="following" v-if="session.authenticated">
                <button class="button is-success" v-if="followingTopic(route.params.topic as string)"
                        @click="unfollowTopic(route.params.topic as string)">
                    <div class="icon-text">
                        <span class="icon">
                            <i class="fa-solid fa-check"></i>
                        </span>
                        <span>Following</span>
                    </div>
                </button>
                <button v-else class="button is-danger" @click="followTopic(route.params.topic as string)">
                    <div class="icon-text">
                        <span class="icon">
                            <i class="fa-solid fa-plus"></i>
                        </span>
                        <span>Follow</span>
                    </div>
                </button>
            </div>
        </div>
        <PostList :posts="topicPosts" />
    </div>
</template>

<style scoped lang="scss">
@import '../styles/global.scss';

.topic-header {
    @include flex-h;
    justify-content: space-between;
    align-items: center;
    gap: 1em;

    >* {
        flex: 1 1 0;
    }
}

.following {
    @include flex-h;
    justify-content: right;
}
</style>