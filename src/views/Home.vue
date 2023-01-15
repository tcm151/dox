<script setup lang="ts">
import axios from 'axios';
import { inject, onBeforeMount, onMounted, ref } from 'vue';
import { Post } from '../api/types';
import { sortPosts } from '../services/sorting';
import { navigateTo } from '../services/router';
import Sorter from '../components/utilities/Sorter.vue';
import Sidebar from '../components/nav/Sidebar.vue';
import PostList from '../components/posts/PostList.vue';
import { GetSession } from '../services/store.new';

const session = GetSession();

onBeforeMount(async () => {

    session.updateUserData();

    const filter = session.get("filter")
    postFilter.value = filter ?? "All";

    try {
        const allPostsResponse = await axios.get<Post[]>("https://www.tcmdev.ca/dox/posts")
        console.log(allPostsResponse.data)
        allPosts.value = allPostsResponse.data;
        allPosts.value = sortPosts(allPosts.value, "hot")


        if (session.User) {
            feedPosts.value = allPosts.value.filter((post) =>
                session.User?.following.includes(post.user_id) ||
                post.topics.some(topic => session.User?.topics.includes(topic))
            )
        }
        feedPosts.value = sortPosts(feedPosts.value, "hot")

        switch (postFilter.value) {
            case "All":
                posts.value = allPosts.value;
                break;
            case "Feed":
                posts.value = feedPosts.value;
                break;
        }
    }
    catch (error: any) {
        console.log(error);
        toggleModal("Failed to load posts...", "Server may be in a non-functioning state.")
    }

})

const posts = ref<Post[]>([]);
const allPosts = ref<Post[]>([])
const feedPosts = ref<Post[]>([]);
const currentSortType = ref<string>("");

const toggleModal = inject("toggleModal") as Function;

const postFilter = ref<string>("LOZER");

function toggleFilter() {
    switch (postFilter.value) {
        case "All":
            postFilter.value = "Feed";
            allPosts.value = posts.value;
            posts.value = feedPosts.value;
            session.set("filter", "Feed")
            break;
        case "Feed":
            postFilter.value = "All";
            feedPosts.value = posts.value;
            posts.value = allPosts.value;
            session.set("filter", "All")
            break;
    }
}

function sortBy(sortType: string) {
    currentSortType.value = sortType;
    posts.value = sortPosts(posts.value, sortType);
}

</script>


<template>
    <div class="home p-2">
        <div class="posts">
            <div class="toolbar">
                <div class="toolbar-left">
                    <div class="button is-primary has-text-weight-bold" @click.prevent="toggleFilter()">
                        <span class="icon">
                            <i class="fa-solid fa-crown"></i>
                        </span>
                        <span>{{ postFilter }}</span>
                    </div>
                    <div class="button is-link has-text-weight-bold" @click.prevent="navigateTo('/editor')">
                        <span class="icon">
                            <i class="fa-solid fa-feather-pointed"></i>
                        </span>
                        <span>Post</span>
                    </div>
                </div>
                <div class="toolbar-right">
                    <Sorter @sort-by="sortBy" />
                </div>
            </div>
            <PostList :posts="posts" />
        </div>
        <div class="sidebar">
            <Sidebar />
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '../styles/global.scss';

.home {
    @include flex-hw (0.5em);

    .posts {
        flex: 8 1 400px;
    }

    .sidebar {
        flex: 1 1 250px;
    }
}

.toolbar {
    @include flex-hw (0.5em);

    .toolbar-left {
        flex: 2 2;
        @include flex-h (0.5em);

        .button {
            flex: 1 1 0;
        }
    }

    .toolbar-right {
        flex: 3 3;
        @include flex-h (0.5em);

        .button {
            flex: 1 1;
            min-width: 92px;
        }
    }
}
</style>