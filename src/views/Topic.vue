<script setup lang="ts">
import axios from 'axios';
import { computed, inject, onBeforeMount, ref, watch, getCurrentInstance } from 'vue';
import { useRoute } from 'vue-router';
import { Post, User } from '../api/types';
import Sorter from '../components/utilities/Sorter.vue';
import PostList from '../components/posts/PostList.vue';
import { GetSession } from '../services/store.new';

const session = GetSession();

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
    session.User?.topics.push(topic);
    axios.patch(
        `https://doxforeverything.herokuapp.com/users/${session.User?.user_id}/topics`,
        new URLSearchParams({
            topics: JSON.stringify(session.User?.topics)
        }))
    session.updateTopics(session.User!.topics);
}

async function unfollowTopic(topic: string) {
    session.User!.topics = session.User?.topics.filter(t => t !== topic)!;
    axios.patch(
        `https://doxforeverything.herokuapp.com/users/${session.User?.user_id}/topics`,
        new URLSearchParams({
            topics: JSON.stringify(session.User?.topics)
        }))
    session.updateTopics(session.User!.topics);
}

function followingTopic(topic: string) {
    return (session.User?.topics.includes(topic))
}

function sortBy(sortType: string) {

}

</script>

<template>
    <div class="topic-page m-2">
        <div class="topic-header box mb-2 py-3">
            <p class="title my-0">{{ route.params.topic }}</p>
            <div class="following" v-if="session.isAuthenticated">
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
        <Sorter @sort-by="sortBy" />
        <PostList :posts="topicPosts" />
    </div>
</template>

<style scoped lang="scss">
@import '../styles/global.scss';

.topic-header {
    @include flex-hw;
    justify-content: space-between;
    align-items: center;
    gap: 1em;

    >* {
        flex: 1 1 0;
    }

    .title {
        white-space: nowrap;
    }
}

.following {
    @include flex-h;
    justify-content: right;
}
</style>