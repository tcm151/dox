<script setup lang="ts">
import { Post } from '~~/types/types';

const session = getSession();

let title = ref("");
let content = ref("")

let newTopic = ref("");
let topics = ref<string[]>([]);
let isFocused = ref(false)

function isValid() {
    return /^\b[A-Za-z]{3,16}\b$/.test(newTopic.value)
}

function addTopic() {
    if (isValid()) {
        topics.value.push(newTopic.value);
        newTopic.value = "";
        return;
    }

    console.log("Invalid topic.");
    return;
}

function removeTopic(topic: string) {
    topics.value = topics.value.filter(t => t !== topic);
}

async function submit() {
    try {
        const post = await session.useApi<Post>("/api/post/new", {
            user: session.user!.id,
            title: title.value,
            content: content.value,
            votes: {
                positive: [session.user!.id],
                misleading: [],
                negative: [],
            },
            time: new Date(),
            topics: topics.value,
            comments: [],
        })

        navigateTo(`/post/${post?.id.split(':')[1]}`)
    }
    catch (ex) {
        console.log(ex)
    }
}
</script>

<template>
    <div class="editor p-5">
        <h1 class="mb-4">New Post</h1>
        <div class="form">
            <div class="field">
                <label>Title</label>
                <input v-model="title" type="text" />
            </div>
            <div class="field">
                <label>Content</label>
                <textarea v-model="content" type="text" rows="8" />
            </div>
            <div class="field">
                <label>Topics</label>
                <input :class="{ 'invalid': isFocused && !isValid() }" v-model="newTopic" @keyup.enter="addTopic"
                       @focus="isFocused = true" @blur="isFocused = false" type="text" spellcheck="false">
                <div class="row g-2 mt-2" v-if="topics.length > 0">
                    <div class="topic" v-for="topic in topics" @contextmenu.prevent="removeTopic(topic)">
                        <p>{{ topic }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="row g-2 mt-5">
            <button class="success" @click="submit">Submit</button>
            <button class="danger">Cancel</button>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";

textarea {
    resize: vertical;
}

.editor {
    @include fill-width(512px);
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
}

.row {
    display: flex;
    flex-direction: row;
}

.topic {
    flex: 0 1;
    padding: 0.25rem 0.5rem;
    white-space: nowrap;
    font-size: 0.8rem;
    font-weight: 700;
    border-radius: 0.25rem;
}

.invalid {
    border: 1px solid red;
}
</style>