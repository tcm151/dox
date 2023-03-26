<script setup lang="ts">
import { Post, Draft } from '~/types'


const hints = useHints();
const session = getSession();

let title = ref("");
let content = ref("")
let topics = ref<string[]>([]);

let newTopic = ref("");
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

    if (draftId.value !== '') {
        await session.useApi<Draft>(`/api/profile/drafts/${getId(draftId.value)}/update`, {
            title: title.value,
            content: content.value,
            topics: topics.value,
        })
        hints.addSuccess("Draft updated")
    }
    else {
        await session.useApi<Draft>("/api/profile/drafts/add", {
            user: session.user!.id,
            title: title.value,
            content: content.value,
            time: new Date(),
            topics: topics.value,
        })
        hints.addSuccess("Draft saved")
    }
}


let draftId = ref('')
let showDrafts = ref(false)
let userDrafts = ref<Draft[]>([]);

async function openDrafts() {
    showDrafts.value = true;
    userDrafts.value = await session.useApi<Draft[]>("/api/profile/drafts") ?? []
    // let { data, pending, } = await session.useApi<Post[]>("/api/profile/drafts") ?? []
}

function viewDraft(draft: Draft) {
    draftId.value = draft.id
    title.value = draft.title
    content.value = draft.content
    topics.value = draft.topics
    showDrafts.value = false
}

async function deleteDraft(draft: Draft) {
    userDrafts.value = userDrafts.value.filter(d => d.id !== draft.id)
    await session.useApi<Draft>(`/api/profile/drafts/${getId(draft.id)}/delete`)
}

let showPreview = ref(true)
function togglePreview() {
    showPreview.value = !showPreview.value
}
</script>

<template>
    <div id="editor" class="row-wrap g-4">
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
                    <textarea v-model="content" type="text" rows="12" />
                </div>
                <div class="field">
                    <label>Topics</label>
                    <div class="row g-2 mt-2" v-if="topics.length > 0">
                        <div class="topic" v-for="topic in topics" @contextmenu.prevent="removeTopic(topic)">
                            <p>{{ topic }}</p>
                        </div>
                    </div>
                    <input :class="{ 'invalid': topicsFocused && !validTopic() }" v-model="newTopic" @keyup.enter="addTopic"
                           @focus="topicsFocused = true" @blur="topicsFocused = false" type="text" spellcheck="false">
                </div>
            </div>
            <div class="row g-2 mt-5">
                <button class="success" @click="submit">Submit</button>
                <button class="info" @click="saveDraft">Save Draft</button>
                <button class="link" @click="togglePreview">
                    <span v-if="!showPreview">Show Preview</span>
                    <span v-else>Hide Preview</span>
                </button>
                <button class="danger">Cancel</button>
            </div>
        </section>
        <Transition name="preview">
            <section class="preview p-5" v-if="showPreview">
                <ClientOnly>
                    <h1 class="mb-2">{{ title }}</h1>
                    <div class="content" v-html="renderMarkdown(content)">
                    </div>
                    <span class="watermark" v-if="title === '' && content === ''">Preview</span>
                </ClientOnly>
            </section>
        </Transition>
        <ClientOnly>
            <Window :visible="showDrafts" title="Drafts" @close="showDrafts = false">
                <section class="drafts column" v-if="userDrafts.length > 0">
                    <div class="column" v-for="draft in userDrafts" :key="draft.id">
                        <h3 class="title mx-1 mb-1">{{ draft.title }}</h3>
                        <div class="row g-2">
                            <span class="topic" v-for="topic in draft.topics">
                                {{ topic }}
                            </span>
                            <span class="info">{{ formatDate(draft.time) }}</span>
                            <button @click="viewDraft(draft)">
                                <i class="fa-solid fa-book-open"></i>
                                <span>View</span>
                            </button>
                            <button class="danger" @click="deleteDraft(draft)">
                                <i class="fa-solid fa-trash"></i>
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </section>
                <Spinner fontSize="2rem" :showLoadingText="true" v-else /> 
            </Window>
        </ClientOnly>
    </div>
</template>

<style lang="scss">
img {
    max-width: 100%;
    max-height: 256px;
}
code {
    font-size: 0.95rem;
    font-weight: 500;
    font-family: 'Roboto Mono', monospace;
    border-radius: 0.25rem;
    background-color: $dox-white-light !important;
}
</style>

<style scoped lang="scss">
#editor {
    @include fill-width (1200px, 2rem);
    justify-content: center;
}

#header {
    align-items: center;
    justify-content: space-between;

    button {
        max-width: 128px;
    }
}

.editor, .preview {
    flex: 1 1 500px;
    min-width: 250px;
    max-width: 800px;
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
}

.preview {
    position: relative;
    min-height: 100px;

    .watermark {
        top: 50%;
        left: 50%;
        position: absolute;
        font-size: 6rem;
        font-weight: 900;
        opacity: 0.05;
        color: $dox-purple;
        text-align: center;
        text-transform: uppercase;
        transform: translate(-50%, -50%);
    }
}

.preview-enter-active,
.preview-leave-active {
    transition: all 256ms ease;
}

.preview-enter-from,
.preview-leave-to {
    opacity: 0;
}


.content {
    h1, h2, h3, h4 {
        margin-bottom: 0.2rem !important;
    }
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
    max-width: 750px;
    
    h3 {
        overflow-x: hidden;
        text-overflow: ellipsis;
    }

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