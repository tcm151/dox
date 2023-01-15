<script setup lang="ts">
import axios from 'axios';
import { computed, inject, onBeforeMount, ref, watch, getCurrentInstance } from 'vue';
import { useRoute } from 'vue-router';
import { Post, User } from '../api/types';
import Sorter from '../components/utilities/Sorter.vue';
import PostList from '../components/posts/PostList.vue';
import { GetSession } from '../services/store.new';

export interface Topic {
    name: string,
    posts: number,
    followers: number
}

const session = GetSession();

const route = useRoute();
const topicPosts = ref<Post[]>([])

const topic = ref<Topic>({} as Topic);

const toggleModal = inject("toggleModal") as Function;

onBeforeMount(async () => {
    fetchPosts()

    const response = await axios.get(`https://www.tcmdev.ca/dox/topics/${route.params.topic}/info`)
    console.log(response.data);

    topic.value = {
        name: String(route.params.topic),
        posts: response.data.posts,
        followers: response.data.followers,
    }
})
watch(() => route.params, () => fetchPosts())

async function fetchPosts() {
    try {
        const topicPostsResponse = await axios.get<Post[]>(`https://www.tcmdev.ca/dox/posts/topic/${route.params.topic}`)
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
        `https://www.tcmdev.ca/dox/users/${session.User?.user_id}/topics`,
        new URLSearchParams({
            topics: JSON.stringify(session.User?.topics)
        }))
    session.updateTopics(session.User!.topics);
}

async function unfollowTopic(topic: string) {
    session.User!.topics = session.User?.topics.filter(t => t !== topic)!;
    axios.patch(
        `https://www.tcmdev.ca/dox/users/${session.User?.user_id}/topics`,
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
            <p class="topic">{{ route.params.topic }}</p>
            <div class="stats">
                <div class="follow">
                    <p class="count">{{ topic?.posts }}</p>
                    <p class="label">Posts</p>
                </div>
                <div class="follow">
                    <p class="count">{{ topic?.followers }}</p>
                    <p class="label">Followers</p>
                </div>
            </div>
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
    @include flex-hw (2em);
    align-items: center;
    justify-content: space-between;

    .following {
        flex: 1 1 0;
    }

    .topic {
        font-size: 2em;
        font-weight: 900;
    }
}

.following {
    @include flex-h;
    justify-content: right;
}

.stats {
    @include flex-h (1em);

    .follow {
        @include flex-h (0.25em);

        .count {
            font-size: 1.25em;
            font-weight: 700;
        }

        .label {
            font-size: 1.25em;
            font-weight: 500;
        }
    }
}
</style>