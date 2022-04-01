<template>
    <form class="box m-5 has-background-light">
        <div class="block content">
            <h2>Title</h2>
            <input class="input" v-model="title" />
        </div>
        <div class="block content">
            <h4>Content</h4>
            <textarea class="textarea" rows="12" v-model="content"></textarea>
        </div>
        <button class="button" @click.prevent="uploadPost">Post</button>
        <button class="button" @click.prevent="testButton">Date</button>
    </form>
</template>

<script setup lang="ts">
import axios from 'axios';
import { computed, ref } from 'vue';
import { Post } from '../api/types';
import { router } from '../services/router';
import { store } from '../services/store';
import moment from "moment";

const title = ref("");
const content = ref("");

const session = computed(() => {
    return store.state.session;
})

function testButton() {
    console.log(moment().format("MM/DD/YY, HH:mm:ss"))
}

async function uploadPost() {
    const response = await axios.post<Post>(
        "http://localhost:8080/newPost",
        new URLSearchParams({
            user_id: store.getters.getSession.user.user_id,
            title: title.value,
            content: content.value,
        }))
    console.log(response.data);
    router.push(`/posts/${response.data.post_id}`)
}

</script>