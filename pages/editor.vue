<script setup lang="ts">
import { Post } from '~~/types/types';

const hints = useHints();
const session = getSession();

let title = ref("");
let content = ref("")
let newTopic = ref("");
let topics = ref<string[]>([]);

let titleFocused = ref(false)
let topicsFocused = ref(false)



function validTitle() {
    return /.{4,128}/.test(title.value)
}

function validTopic() {
    return /^\b[A-Za-z]{3,16}\b$/.test(newTopic.value)
}


function addTopic() {
    if (validTopic()) {
        topics.value.push(newTopic.value);
        newTopic.value = "";
        return;
    }
    hints.addWarning("Topic is not valid")
}

function removeTopic(topic: string) {
    topics.value = topics.value.filter(t => t !== topic);
}

async function submit() {

    if (!validTitle()) {
        hints.addError("Title is invalid");
        return;
    }

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
    <div class="column g2">
        <div class="editor p-5">
            <h1 class="mb-4">New Post</h1>
            <div class="form">
                <div class="field">
                    <label>Title</label>
                    <input :class="{ 'invalid': titleFocused && !validTitle() }" v-model="title" @focus="titleFocused = true" @blur="titleFocused = false" type="text" />
                </div>
                <div class="field">
                    <label>Content</label>
                    <!-- TODO show markdown preview -->
                    <textarea v-model="content" type="text" rows="16" />
                </div>
                <div class="field">
                    <label>Topics</label>
                    <input :class="{ 'invalid': topicsFocused && !validTopic() }" v-model="newTopic" @keyup.enter="addTopic"
                           @focus="topicsFocused = true" @blur="topicsFocused = false" type="text" spellcheck="false">
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
    </div>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";

.column {
    @include fill-width (512px);
}

.editor {
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
    background-color: $dox-red-light !important;
}

textarea {
    resize: vertical;
}
</style>