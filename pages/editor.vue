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
        const post = await session.useApi<Post>("/api/post/add", {
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

async function saveDraft() {
    
    // TODO validate post here as well, create separate function
    
    try {
        const post = await session.useApi<Post>("/api/post/add", {
            draft: true,
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
        
    }
    catch (ex) {
        console.log(ex)
    }
}


let draft = ref(false);
let showDrafts = ref(false)
let drafts = ref<Post[]>([]);

async function openDrafts() {
    showDrafts.value = true;
    drafts.value = await session.useApi<Post[]>("/api/profile/drafts") ?? []
}

function viewDraft(post: Post) {
    draft.value = true
    title.value = post.title
    content.value = post.content
    topics.value = post.topics
    showDrafts.value = false
}
</script>

<template>
    <div id="editor" class="row g-3">
        <section class="editor p-5">
            <div id="header" class="row mb-4">
                <h1>New Post</h1>
                <button @click="openDrafts">
                    <i class="fa-solid fa-compass-drafting"></i>
                    <span class="ml-2">Drafts</span>
                </button>
            </div>
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
                <button class="info" @click="saveDraft">Save Draft</button>
                <button class="danger">Cancel</button>
            </div>
        </section>
        <section class="preview p-5">
            <h1 class="mb-2">{{ title }}</h1>
            <div class="content" v-html="renderMarkdown(content)">
            </div>
        </section>
        <ClientOnly>
            <Window :visible="showDrafts" title="Drafts" :width="500" @close="showDrafts = false">
                <section class="drafts column">
                    <div class="column" v-for="post in drafts" :key="post.id">
                        <h3 class="title mx-1 mb-1">{{ post.title }}</h3>
                        <div class="row g-2">
                            <span class="topic" v-for="topic in post.topics">
                                {{ topic }}
                            </span>
                            <span class="info">{{ formatDate(post.time) }}</span>
                            <button @click="viewDraft(post)">
                                <i class="fa-solid fa-book-open"></i>
                                <span>View</span>
                            </button>
                            <button class="danger" @click="viewDraft(post)">
                                <i class="fa-solid fa-trash"></i>
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </section>
            </Window>
        </ClientOnly>
    </div>
</template>

<style scoped lang="scss">
#editor {
    @include fill-width (1000px, 1.5rem);
}

#header {
    align-items: center;
    justify-content: space-between;

    button {
        max-width: 128px;
    }
}

.editor, .preview {
    min-width: 256px;
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
}

.content {
    h1, h2, h3, h4 {
        margin-bottom: 0.2rem !important;
    }
}

.row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
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

section.drafts {
    @include flex-v (0.5rem);

    #post-title {
        font-size: 1.25rem;
        font-weight: 500;
        white-space: nowrap;
    }    

    .topic, .info, button {
        font-size: 1rem;
        font-weight: 700;
        text-align: center;
        white-space: nowrap;
        border-radius: 0.25rem;
        padding: 0.25rem 1rem;
    }

    .topic, .info {
        flex: 1 1 auto;
    }

    button {
        flex: 0 1 32px;
    }

    button {
        @include flex-h (0.5rem);
        justify-content: center;
        align-items: center;
    }
}
</style>