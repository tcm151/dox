<template>
    <form class="box m-5 has-background-light" v-if="session.authenticated">
        <div class="block content">
            <h2>Title</h2>
            <input class="input" v-model="title" />
        </div>
        <div class="block content">
            <h4>Content</h4>
            <textarea class="textarea" rows="12" v-model="content"></textarea>
        </div>
        <button class="button" @click.prevent="uploadPost">Post</button>
    </form>
    <div v-else class="box m-5">
        <p>You must create an account to post...</p>
    </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { Post } from '../api/types';
import { store } from '../services/store';
import { router } from '../services/router';
import { computed, inject, ref } from 'vue';

const session = computed(() => {
    return store.state.session;
})

const title = ref("");
const content = ref("");

const toggleModal = inject("toggleModal") as Function

async function uploadPost() {
    try {
        const response = await axios.post<Post>(
            "https://doxforeverything.herokuapp.com/newPost",
            new URLSearchParams({
                title: title.value,
                content: content.value,
                user_id: store.getters.getSession.user.user_id,
            }))
        console.log(response.data);
        router.push(`/posts/${response.data.post_id}`)
    }
    catch (error) {
        console.log(error)
        toggleModal("Failed to upload post...")
    }
}

</script>