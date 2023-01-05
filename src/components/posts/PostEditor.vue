<script setup lang="ts">
import axios from 'axios';
import { Post } from '../../api/types';
import { navigateTo, router } from '../../services/router';
import { computed, inject, ref } from 'vue';
import Tag from '../utilities/Tag.vue';
import { GetSession } from '../../services/store.new';
import TextEditor from '../utilities/TextEditor.vue';

const session = GetSession();

const title = ref("");
const content = ref("");
const topicText = ref("")
const topics = ref<string[]>([])

const toggleModal = inject("toggleModal") as Function

function addTopic() {
    if (/\s/.test(topicText.value)) {
        toggleModal("Topic name contains whitespace", "Topics cannot contain any whitespace characters, try removing them")
        return;
    }
    if (topicText.value.length < 2) {
        toggleModal("Topic name is too short", "Topics must be at least 2 characters, try to be more specific")
        return;
    }
    if (topicText.value.length > 18) {
        toggleModal("Topic name is too long", "Topics must 18 characters or less, try to be more concise")
        return;
    }
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
            "http://172.105.97.135:8080/newPost",
            new URLSearchParams({
                title: title.value,
                content: content.value,
                topics: JSON.stringify(topics.value),
                user_id: String(session.User!.user_id),
            }))
        console.log({
            title: title.value,
            content: content.value,
            topics: JSON.stringify(topics.value),
            user_id: String(session.User!.user_id),
        })
        console.log(response.data);
        navigateTo(`/posts/${response.data.post_id}`)
        router.push(`/posts/${response.data.post_id}`)
    }
    catch (error) {
        console.log(error)
        toggleModal("Failed to upload post...")
    }
}

function updateText(newText: string) {
    console.log("Text changed!")
    content.value = newText;
}

</script>


<template>
    <div class="box m-2" v-if="session.isAuthenticated">
        <div class="field">
            <div class="control">
                <p class="title is-3 mb-2">Title</p>
                <input class="input" v-model="title" />
            </div>
        </div>
        <div class="field">
            <div class="control">
                <p class="title is-4 mb-2">Content</p>
                <!-- <textarea class="textarea" rows="8" v-model="content"></textarea> -->
                <TextEditor :text="content" @text-changed="updateText" />
            </div>
        </div>

        <div class="field">
            <div class="control">
                <p class="title is-4 mb-2">Topics</p>
                <div class="post-topics">
                    <div class="tag is-medium is-light is-link" v-for="topic in topics" @click="removeTopic(topic)">
                        {{ topic }}
                    </div>
                    <!-- <Tag v-for="topic in topics" :contents="topic" @delete="removeTopic" /> -->
                </div>
                <input type="text" class="input" v-model="topicText" v-on:keyup.enter="addTopic">
            </div>
        </div>
        <div class="field mt-5">
            <div class="control">
                <button class="button is-primary" @click.prevent="uploadPost">Post</button>
            </div>
        </div>

    </div>
    <div v-else class="box m-5">
        <p>You must create an account to post...</p>
    </div>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.post-topics {
    @include flex-hw (0.5em);

    .tag {
        cursor: pointer;
        filter: brightness(0.95);
        margin-bottom: 0.75em;
    }
}
</style>