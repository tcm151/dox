<template>
    <div class="box m-2 has-background-light" v-if="session.authenticated">
        <div class="field">
            <div class="control">
                <p class="title is-3 mb-4">Title</p>
                <input class="input" v-model="title" />
            </div>
        </div>
        <div class="field">
            <div class="control">
                <p class="subtitle is-4 mb-2">Content</p>
                <textarea class="textarea" rows="8" v-model="content"></textarea>
            </div>
        </div>

        <div class="field">
            <div class="control">
                <p class="subtitle is-4 mb-2">Topics</p>
                <div class="field is-grouped is-grouped-multiline">
                    <Tag v-for="topic in topics" :contents="topic" @delete="removeTopic" />
                    <!-- <Tag contents="NFL" /> -->
                </div>
                <input type="text" class="input" v-model="topicText" v-on:keyup.enter="addTopic">
            </div>
        </div>
        <div class="field">
            <div class="control">
                <button class="button" @click.prevent="uploadPost">Post</button>
            </div>
        </div>

    </div>
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
import Tag from './Tag.vue';

const session = computed(() => {
    return store.state.session;
})

const title = ref("");
const content = ref("");
const topicText = ref("")
const topics = ref<string[]>([])

const toggleModal = inject("toggleModal") as Function

function addTopic() {
    if (topics.value.length >= 5) {
        toggleModal("You can only have 5 topics", "Try to be more specific with which topics you choose.")
        return;
    }
    topics.value.push(topicText.value);
    topicText.value = "";
}

function removeTopic(topic: string) {
    topics.value.splice(topics.value.indexOf(topic), 1)
}

async function uploadPost() {
    if (title.value == "" || content.value == "") {
        toggleModal("Fill in all of the boxes...", "You must supply a title and some content. Don't forget to fill out both!")
        return;
    }


    try {
        const response = await axios.post<Post>(
            "https://doxforeverything.herokuapp.com/newPost",
            new URLSearchParams({
                title: title.value,
                content: content.value,
                topics: JSON.stringify(topics.value),
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